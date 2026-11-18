/**
 * F-02' Đúng hay sai? (SCR-08 §B): từ/câu Thái + một nghĩa đề xuất (50% đúng). 60 s đếm ngược;
 * đúng +100 × combo (tối đa ×5), sai → combo về 0.
 */
import {
  applyAnswer,
  assertAvailable,
  availability,
  cycle,
  finish,
  initialState,
  summarize,
  type Game,
  type GameItemRef,
  type GameState,
} from './game';
import { createRng } from './rng';
import type { GameSource } from './source';

export const TRUE_FALSE_MS = 60_000;
export const TRUE_FALSE_MIN_ITEMS = 6;
const POINTS = 100;
/** Đủ cho 60 s ở tốc độ ~1 câu/giây. */
const QUESTIONS = 80;

export interface TrueFalseQuestion {
  item: GameItemRef;
  th: string;
  /** Nghĩa đề xuất. */
  shown: string;
  /** Nghĩa đúng. */
  expected: string;
  isTrue: boolean;
}

export interface TrueFalseRound {
  questions: TrueFalseQuestion[];
}

export interface TrueFalseState extends GameState {
  questions: TrueFalseQuestion[];
  index: number;
  endsAt: number;
}

interface Entry {
  item: GameItemRef;
  th: string;
  meaning: string;
}

function entries(source: GameSource): Entry[] {
  return [
    ...source.words.map((w) => ({
      item: { itemType: 'word' as const, itemId: w.id },
      th: w.thai,
      meaning: w.meanings.join('; '),
    })),
    ...source.sentences.map((s) => ({
      item: { itemType: 'sentence' as const, itemId: s.id },
      th: s.th,
      meaning: s.vi,
    })),
  ];
}

export const trueFalse: Game<TrueFalseRound, boolean, TrueFalseState> = {
  id: 'true-false',
  durationMs: TRUE_FALSE_MS,

  // Đếm nghĩa khác nhau: luôn có nghĩa sai để đề xuất.
  availability: (source) =>
    availability(
      'words',
      TRUE_FALSE_MIN_ITEMS,
      new Set(entries(source).map((e) => e.meaning)).size,
    ),

  generateRound(source, seed) {
    assertAvailable('true-false', this.availability(source));
    const rng = createRng(seed);
    const all = entries(source);
    const questions = cycle(rng, all, QUESTIONS).map((e): TrueFalseQuestion => {
      const isTrue = rng.next() < 0.5;
      if (isTrue) return { item: e.item, th: e.th, shown: e.meaning, expected: e.meaning, isTrue };
      // Nghĩa sai: ưu tiên mục cùng loại (từ ↔ từ, câu ↔ câu) để khó đoán theo độ dài.
      const others = all.filter((o) => o.meaning !== e.meaning);
      const sameKind = others.filter((o) => o.item.itemType === e.item.itemType);
      const pool = sameKind.length > 0 ? sameKind : others;
      const wrong = pool[rng.int(pool.length)]!;
      return { item: e.item, th: e.th, shown: wrong.meaning, expected: e.meaning, isTrue };
    });
    return { questions };
  },

  start: (round, now) => ({
    ...initialState(now),
    questions: round.questions,
    index: 0,
    endsAt: now + TRUE_FALSE_MS,
  }),

  answer(state, said, now) {
    if (state.status !== 'playing') return state;
    if (now >= state.endsAt) return finish(state, state.endsAt);
    const q = state.questions[state.index % state.questions.length]!;
    const correct = said === q.isTrue;
    return applyAnswer(
      state,
      {
        item: q.item,
        correct,
        expected: q.expected,
        // Nhận nhầm nghĩa sai là đúng → ghi lại nghĩa đã nhận.
        ...(!correct && !q.isTrue ? { given: q.shown } : {}),
      },
      q.th,
      (combo) => POINTS * combo,
    );
  },

  tick: (state, now) => (now >= state.endsAt ? finish(state, state.endsAt) : state),

  next(state, now) {
    if (state.status !== 'feedback') return state;
    const moved = { ...state, status: 'playing' as const, index: state.index + 1, feedback: null };
    return now >= state.endsAt ? finish(moved, state.endsAt) : moved;
  },

  score: (state) => state.score,

  summary: (state) =>
    summarize('true-false', state, (state.finishedAt ?? state.endsAt) - state.startedAt),
};
