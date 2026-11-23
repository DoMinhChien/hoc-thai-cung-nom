/**
 * F-03' Xếp câu tốc độ (SCR-08 §B): như E-06 (câu Việt + ngân hàng thẻ từ, không thẻ nhiễu),
 * 5 câu, 20 s/câu. Điểm câu đúng = 100 + giây còn lại × 10; sai / hết giờ = 0, hiện đáp án.
 */
import {
  applyAnswer,
  assertAvailable,
  availability,
  finish,
  initialState,
  summarize,
  type Game,
  type GameItemRef,
  type GameState,
} from './game';
import type { Rng } from './rng';
import { type GameSentence, type GameSource, sourceRng } from './source';

export const SENTENCE_RUSH_COUNT = 5;
export const SENTENCE_RUSH_MS = 20_000;
const POINTS = 100;
const PER_SECOND_LEFT = 10;

export interface SentenceRushQuestion {
  item: GameItemRef;
  vi: string;
  th: string;
  accepted: string[];
  /** Thẻ từ đã xáo (không trùng thứ tự đáp án). */
  bank: string[];
}

export interface SentenceRushRound {
  questions: SentenceRushQuestion[];
}

export interface SentenceRushState extends GameState {
  questions: SentenceRushQuestion[];
  index: number;
  questionStartedAt: number;
}

const playable = (source: GameSource) => source.sentences.filter((s) => s.tokens.length >= 2);
const compact = (text: string) => text.replace(/\s+/g, '');

function bank(rng: Rng, s: GameSentence): string[] {
  for (let i = 0; i < 5; i++) {
    const shuffled = rng.shuffle(s.tokens);
    if (shuffled.join('') !== s.tokens.join('')) return shuffled;
  }
  // Xáo mãi vẫn trùng (vd. thẻ giống nhau): xoay một bước.
  return [...s.tokens.slice(1), s.tokens[0]!];
}

/** Thời điểm hết giờ câu hiện tại. */
export const questionEndsAt = (state: SentenceRushState) =>
  state.questionStartedAt + SENTENCE_RUSH_MS;

function grade(state: SentenceRushState, tokens: readonly string[] | null, now: number) {
  const q = state.questions[state.index]!;
  const given = tokens?.join('');
  const correct = given !== undefined && q.accepted.some((a) => compact(a) === compact(given));
  const left = Math.max(0, Math.floor((questionEndsAt(state) - now) / 1000));
  return applyAnswer(
    state,
    { item: q.item, correct, expected: q.th, ...(given === undefined ? {} : { given }) },
    q.th,
    () => POINTS + left * PER_SECOND_LEFT,
  );
}

export const sentenceRush: Game<SentenceRushRound, readonly string[], SentenceRushState> = {
  id: 'sentence-rush',
  durationMs: null,

  availability: (source) => availability('sentences', SENTENCE_RUSH_COUNT, playable(source).length),

  generateRound(source, seed) {
    assertAvailable('sentence-rush', this.availability(source));
    const rng = sourceRng(seed, source);
    const questions = rng
      .shuffle(playable(source))
      .slice(0, SENTENCE_RUSH_COUNT)
      .map((s) => ({
        item: { itemType: 'sentence' as const, itemId: s.id },
        vi: s.vi,
        th: s.th,
        accepted: s.accepted,
        bank: bank(rng, s),
      }));
    return { questions };
  },

  start: (round, now) => ({
    ...initialState(now),
    questions: round.questions,
    index: 0,
    questionStartedAt: now,
  }),

  answer(state, tokens, now) {
    if (state.status !== 'playing') return state;
    return grade(state, now >= questionEndsAt(state) ? null : tokens, now);
  },

  tick: (state, now) =>
    state.status === 'playing' && now >= questionEndsAt(state) ? grade(state, null, now) : state,

  next(state, now) {
    if (state.status !== 'feedback') return state;
    const index = state.index + 1;
    const moved = { ...state, status: 'playing' as const, feedback: null, index };
    return index >= state.questions.length
      ? finish(moved, now)
      : { ...moved, questionStartedAt: now };
  },

  score: (state) => state.score,

  summary: (state) =>
    summarize('sentence-rush', state, (state.finishedAt ?? state.startedAt) - state.startedAt),
};
