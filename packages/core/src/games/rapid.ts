/**
 * Khung trò "3 tim" (v7.3, tham khảo Speed Review của Memrise) cho F-02' Đúng hay sai? và F-04'
 * Đoán loại từ: mỗi câu có giờ riêng theo độ dài; sai hoặc hết giờ mất 1 tim; đúng 15 câu liền
 * thêm 1 tim; hết tim → kết thúc. Điểm câu đúng = 100 × combo + thưởng tốc độ 0..50.
 */
import {
  applyAnswer,
  assertAvailable,
  finish,
  initialState,
  summarize,
  type Game,
  type GameAvailability,
  type GameId,
  type GameItemRef,
  type GameState,
} from './game';
import type { GameSource } from './source';

export const START_LIVES = 3;
export const MAX_LIVES = 5;
/** Đúng liền chừng này câu → +1 tim. */
export const BONUS_LIFE_STREAK = 15;
export const BASE_QUESTION_MS = 5_000;
export const MAX_QUESTION_MS = 9_000;
const PER_THREE_TOKENS_MS = 1_000;
const POINTS = 100;
const SPEED_BONUS = 50;

/** Giờ mỗi câu theo độ dài: từ đơn 5 s, câu thêm 1 s mỗi 3 thẻ từ, tối đa 9 s. */
export function questionTimeMs(tokens: number): number {
  return Math.min(MAX_QUESTION_MS, BASE_QUESTION_MS + Math.floor(tokens / 3) * PER_THREE_TOKENS_MS);
}

export interface RapidQuestion {
  item: GameItemRef;
  th: string;
  expected: string;
  timeMs: number;
}

export interface RapidRound<Q extends RapidQuestion> {
  questions: Q[];
}

export interface RapidState<Q extends RapidQuestion> extends GameState {
  questions: Q[];
  index: number;
  questionStartedAt: number;
  lives: number;
  /** Chuỗi đúng liên tiếp (không giới hạn — tính tim thưởng). */
  streak: number;
  /** Tim thay đổi ở câu vừa trả lời (UI làm hiệu ứng). */
  lifeDelta: -1 | 0 | 1;
}

export const currentQuestion = <Q extends RapidQuestion>(state: RapidState<Q>) =>
  state.questions[state.index % state.questions.length]!;

/** Thời điểm hết giờ câu hiện tại. */
export const rapidQuestionEndsAt = <Q extends RapidQuestion>(state: RapidState<Q>) =>
  state.questionStartedAt + currentQuestion(state).timeMs;

export interface RapidSpec<Q extends RapidQuestion, A> {
  id: GameId;
  availability(source: GameSource): GameAvailability;
  generate(source: GameSource, seed: number): Q[];
  isCorrect(question: Q, answer: A): boolean;
  /** Câu trả lời để hiện trong danh sách mục sai; `undefined` = không hiện. */
  given(question: Q, answer: A): string | undefined;
}

export function rapidGame<Q extends RapidQuestion, A>(
  spec: RapidSpec<Q, A>,
): Game<RapidRound<Q>, A, RapidState<Q>> {
  const grade = (state: RapidState<Q>, answer: { value: A } | null, now: number) => {
    const q = currentQuestion(state);
    const correct = answer !== null && spec.isCorrect(q, answer.value);
    const given = answer === null || correct ? undefined : spec.given(q, answer.value);
    const left = Math.max(0, rapidQuestionEndsAt(state) - now);
    const next = applyAnswer(
      state,
      { item: q.item, correct, expected: q.expected, ...(given === undefined ? {} : { given }) },
      q.th,
      (combo) => POINTS * combo + Math.round((SPEED_BONUS * left) / q.timeMs),
    );
    const streak = correct ? state.streak + 1 : 0;
    const bonus = correct && streak % BONUS_LIFE_STREAK === 0 && state.lives < MAX_LIVES;
    const lifeDelta = correct ? (bonus ? 1 : 0) : -1;
    return { ...next, streak, lives: state.lives + lifeDelta, lifeDelta } as RapidState<Q>;
  };

  return {
    id: spec.id,
    durationMs: null,
    availability: spec.availability,

    generateRound(source, seed) {
      assertAvailable(spec.id, spec.availability(source));
      return { questions: spec.generate(source, seed) };
    },

    start: (round, now) => ({
      ...initialState(now),
      questions: round.questions,
      index: 0,
      questionStartedAt: now,
      lives: START_LIVES,
      streak: 0,
      lifeDelta: 0,
    }),

    answer(state, value, now) {
      if (state.status !== 'playing') return state;
      return grade(state, now >= rapidQuestionEndsAt(state) ? null : { value }, now);
    },

    tick: (state, now) =>
      state.status === 'playing' && now >= rapidQuestionEndsAt(state)
        ? grade(state, null, now)
        : state,

    next(state, now) {
      if (state.status !== 'feedback') return state;
      if (state.lives <= 0) return finish(state, now);
      return {
        ...state,
        status: 'playing',
        feedback: null,
        lifeDelta: 0,
        index: state.index + 1,
        questionStartedAt: now,
      };
    },

    score: (state) => state.score,

    summary: (state) =>
      summarize(spec.id, state, (state.finishedAt ?? state.startedAt) - state.startedAt),
  };
}
