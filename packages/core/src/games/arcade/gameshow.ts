/**
 * F-16 Đố vui truyền hình (plan 0.14, mẫu "gameshow quiz"): 12 câu trắc nghiệm trộn từ engine Bài
 * tập (E-01 nghĩa từ, E-02 chọn chữ Thái, E-05 bản dịch câu, E-14 loại từ), 15 s mỗi câu, trợ giúp
 * **50:50** và **thêm giờ** (mỗi loại một lần), 3 câu cuối là **vòng thưởng** (điểm ×2). Trả lời
 * xong dừng ở màn phản hồi tới khi người chơi bấm tiếp (`{ next: true }`).
 */
import { EXERCISES, type ExerciseType } from '../../exercises/exercises';
import type { ExercisePool } from '../../exercises/pool';
import { availability, assertAvailable, type GameItemRef } from '../game';
import { createRng } from '../rng';
import type { GameSource } from '../source';
import {
  advance,
  arcadeAnswer,
  arcadeInitial,
  arcadeSummary,
  finishArcade,
  type ArcadeGame,
  type ArcadeState,
} from './arcade';

export const GAMESHOW_QUESTIONS = 12;
/** Số câu cuối tính điểm ×2. */
export const BONUS_QUESTIONS = 3;
export const GAMESHOW_QUESTION_MS = 15_000;
export const EXTRA_TIME_MS = 10_000;
/** Cần ≥ chừng này mục ra được đề. */
export const GAMESHOW_MIN_ITEMS = 8;
const POINTS = 100;
const SPEED_BONUS = 100;
/** Thứ tự ưu tiên loại đề cho mỗi mục (xoay vòng để trộn). */
const WORD_TYPES: ExerciseType[] = ['E-01', 'E-02', 'E-14'];
const SENTENCE_TYPES: ExerciseType[] = ['E-05'];

export interface GameshowQuestion {
  type: ExerciseType;
  item: GameItemRef;
  /** Chữ Thái của mục (danh sách mục sai). */
  th: string;
  prompt: { th?: string; vi?: string };
  optionsLang: 'th' | 'vi';
  options: string[];
  answer: string;
  /** Câu thuộc vòng thưởng. */
  bonus: boolean;
}

export interface GameshowRound {
  questions: GameshowQuestion[];
}

export type Lifeline = 'fifty' | 'time';

export interface GameshowState extends ArcadeState {
  questions: GameshowQuestion[];
  index: number;
  questionStartMs: number;
  /** Giờ của câu hiện tại (có thể đã cộng "thêm giờ"). */
  timeLimitMs: number;
  /** Lựa chọn đã bị 50:50 bỏ ở câu hiện tại. */
  removed: string[];
  /** Trợ giúp đã dùng. */
  used: Lifeline[];
}

export type GameshowInput = { answer: string } | { lifeline: Lifeline } | { next: true };

export const currentShow = (state: GameshowState) => state.questions[state.index]!;

/** ms còn lại của câu hiện tại. */
export const showTimeLeft = (state: GameshowState) =>
  Math.max(0, state.questionStartMs + state.timeLimitMs - state.elapsedMs);

/** Kho đề Bài tập dựng từ nguồn trò chơi. */
export function sourcePool(source: GameSource): ExercisePool {
  return {
    words: source.words.map((w) => ({
      id: w.id,
      unitId: w.unitId,
      lessonId: '',
      thai: w.thai,
      meaning: w.meanings.join('; '),
      ...(w.classifier ? { classifier: w.classifier } : {}),
    })),
    sentences: source.sentences.map((s) => ({
      id: s.id,
      unitId: s.unitId,
      lessonId: '',
      vi: s.vi,
      th: s.th,
      accepted: s.accepted,
      tokens: s.tokens,
      distractors: [],
    })),
    qa: [],
  };
}

interface Candidate {
  item: GameItemRef;
  th: string;
  types: ExerciseType[];
}

function candidates(source: GameSource, pool: ExercisePool): Candidate[] {
  const supported = (id: string, types: ExerciseType[]) =>
    types.filter((t) => EXERCISES[t].supports(id, pool));
  return [
    ...source.words.map((w) => ({
      item: { itemType: 'word' as const, itemId: w.id },
      th: w.thai,
      types: supported(w.id, WORD_TYPES),
    })),
    ...source.sentences.map((s) => ({
      item: { itemType: 'sentence' as const, itemId: s.id },
      th: s.th,
      types: supported(s.id, SENTENCE_TYPES),
    })),
  ].filter((c) => c.types.length > 0);
}

/**
 * 50:50: bỏ một nửa số lựa chọn sai (tối đa 2), luôn giữ ≥ 1 đáp án sai — câu 3 lựa chọn chỉ bỏ 1.
 * Bỏ theo thứ tự lựa chọn (đã xáo khi ra đề).
 */
export function fiftyFifty(q: Pick<GameshowQuestion, 'options' | 'answer'>): string[] {
  const wrong = q.options.filter((o) => o !== q.answer);
  return wrong.slice(0, Math.min(2, wrong.length - 1));
}

function grade(state: GameshowState, given: string | null): GameshowState {
  const q = currentShow(state);
  const correct = given === q.answer;
  const left = showTimeLeft(state);
  const next = arcadeAnswer(
    state,
    { item: q.item, correct, expected: q.answer, ...(given === null ? {} : { given }) },
    q.th,
    () => (POINTS + Math.round((SPEED_BONUS * left) / state.timeLimitMs)) * (q.bonus ? 2 : 1),
  );
  return { ...next, status: 'feedback' };
}

export const gameshow: ArcadeGame<GameshowRound, GameshowInput, GameshowState> = {
  id: 'gameshow',

  availability(source) {
    return availability('items', GAMESHOW_MIN_ITEMS, candidates(source, sourcePool(source)).length);
  },

  generateRound(source, seed) {
    assertAvailable(this.id, this.availability(source));
    const rng = createRng(seed);
    const pool = sourcePool(source);
    const picked = rng.shuffle(candidates(source, pool)).slice(0, GAMESHOW_QUESTIONS);
    return {
      questions: picked.map((c, i) => {
        const q = EXERCISES[c.types[i % c.types.length]!].generate(c.item.itemId, { pool, rng });
        if (q.kind !== 'choice') throw new Error(`gameshow: ${q.type} không phải trắc nghiệm`);
        return {
          type: q.type,
          item: c.item,
          th: c.th,
          prompt: q.prompt,
          optionsLang: q.optionsLang,
          options: q.options,
          answer: q.answer,
          bonus: i >= picked.length - BONUS_QUESTIONS,
        };
      }),
    };
  },

  start: (round) => ({
    ...arcadeInitial(),
    questions: round.questions,
    index: 0,
    questionStartMs: 0,
    timeLimitMs: GAMESHOW_QUESTION_MS,
    removed: [],
    used: [],
  }),

  tick(state, dtMs, input) {
    if (state.status === 'finished') return state;
    let s = state;
    if (input && 'next' in input && s.status === 'feedback') {
      s =
        s.index + 1 >= s.questions.length
          ? finishArcade(s)
          : {
              ...s,
              status: 'playing',
              feedback: null,
              index: s.index + 1,
              questionStartMs: s.elapsedMs,
              timeLimitMs: GAMESHOW_QUESTION_MS,
              removed: [],
            };
    } else if (input && 'answer' in input && s.status === 'playing') {
      // Lựa chọn không có trong câu hoặc đã bị 50:50 bỏ (phím tắt lệch, UI trễ) → bỏ qua.
      const q = currentShow(s);
      if (q.options.includes(input.answer) && !s.removed.includes(input.answer)) {
        s = grade(s, input.answer);
      }
    } else if (input && 'lifeline' in input && s.status === 'playing') {
      if (!s.used.includes(input.lifeline)) {
        const q = currentShow(s);
        s =
          input.lifeline === 'time'
            ? { ...s, used: [...s.used, 'time'], timeLimitMs: s.timeLimitMs + EXTRA_TIME_MS }
            : {
                ...s,
                used: [...s.used, 'fifty'],
                removed: fiftyFifty(q),
              };
      }
    }
    // Đồng hồ câu chỉ chạy khi đang trả lời (màn phản hồi không tính giờ).
    return advance(s, dtMs, (next) =>
      next.status === 'playing' && showTimeLeft(next) === 0 ? grade(next, null) : next,
    );
  },

  summary: (state) => arcadeSummary('gameshow', state),
};
