/**
 * F-04' Đoán loại từ (SCR-08 §B, v7.2): danh từ → chọn ลักษณนาม trong 4 nút (1 đúng + 3 loại từ
 * khác có trong nguồn). 60 s đếm ngược, 5 s/từ (hết = sai); đúng +100 × combo + thưởng tốc độ 0..50.
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

export const CLASSIFIER_RUSH_MS = 60_000;
export const CLASSIFIER_QUESTION_MS = 5_000;
export const CLASSIFIER_MIN_WORDS = 8;
export const CLASSIFIER_OPTIONS = 4;
const POINTS = 100;
const SPEED_BONUS = 50;
const QUESTIONS = 40;

export interface ClassifierQuestion {
  item: GameItemRef;
  th: string;
  meaning: string;
  expected: string;
  /** 2–4 loại từ đã xáo, gồm đáp án. */
  options: string[];
}

export interface ClassifierRushRound {
  questions: ClassifierQuestion[];
}

export interface ClassifierRushState extends GameState {
  questions: ClassifierQuestion[];
  index: number;
  endsAt: number;
  questionStartedAt: number;
}

const playable = (source: GameSource) => source.words.filter((w) => w.classifier);

/** Thời điểm hết giờ từ hiện tại (không quá hết lượt). */
export const classifierQuestionEndsAt = (state: ClassifierRushState) =>
  Math.min(state.endsAt, state.questionStartedAt + CLASSIFIER_QUESTION_MS);

function grade(state: ClassifierRushState, given: string | null, now: number) {
  const q = state.questions[state.index % state.questions.length]!;
  const correct = given === q.expected;
  const left = Math.max(0, state.questionStartedAt + CLASSIFIER_QUESTION_MS - now);
  return applyAnswer(
    state,
    { item: q.item, correct, expected: q.expected, ...(given === null ? {} : { given }) },
    q.th,
    (combo) => POINTS * combo + Math.round((SPEED_BONUS * left) / CLASSIFIER_QUESTION_MS),
  );
}

export const classifierRush: Game<ClassifierRushRound, string, ClassifierRushState> = {
  id: 'classifier-rush',
  durationMs: CLASSIFIER_RUSH_MS,

  availability(source) {
    const words = playable(source);
    // Cần ≥ 2 loại từ khác nhau để có lựa chọn.
    const distinct = new Set(words.map((w) => w.classifier)).size;
    return availability('classifiers', CLASSIFIER_MIN_WORDS, distinct >= 2 ? words.length : 0);
  },

  generateRound(source, seed) {
    assertAvailable('classifier-rush', this.availability(source));
    const rng = createRng(seed);
    const words = playable(source);
    const classifiers = [...new Set(words.map((w) => w.classifier!))];
    const questions = cycle(rng, words, QUESTIONS).map((w) => {
      const others = rng
        .shuffle(classifiers.filter((c) => c !== w.classifier))
        .slice(0, CLASSIFIER_OPTIONS - 1);
      return {
        item: { itemType: 'word' as const, itemId: w.id },
        th: w.thai,
        meaning: w.meanings[0]!,
        expected: w.classifier!,
        options: rng.shuffle([w.classifier!, ...others]),
      };
    });
    return { questions };
  },

  start: (round, now) => ({
    ...initialState(now),
    questions: round.questions,
    index: 0,
    endsAt: now + CLASSIFIER_RUSH_MS,
    questionStartedAt: now,
  }),

  answer(state, option, now) {
    if (state.status !== 'playing') return state;
    if (now >= state.endsAt) return finish(state, state.endsAt);
    return grade(state, now >= classifierQuestionEndsAt(state) ? null : option, now);
  },

  tick(state, now) {
    if (now >= state.endsAt) return finish(state, state.endsAt);
    return state.status === 'playing' && now >= classifierQuestionEndsAt(state)
      ? grade(state, null, now)
      : state;
  },

  next(state, now) {
    if (state.status !== 'feedback') return state;
    const moved = {
      ...state,
      status: 'playing' as const,
      feedback: null,
      index: state.index + 1,
      questionStartedAt: now,
    };
    return now >= state.endsAt ? finish(moved, state.endsAt) : moved;
  },

  score: (state) => state.score,

  summary: (state) =>
    summarize('classifier-rush', state, (state.finishedAt ?? state.endsAt) - state.startedAt),
};
