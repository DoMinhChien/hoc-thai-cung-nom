/**
 * F-17 Máy bay (plan 0.14, mẫu "airplane"): máy bay bay ngang ở một trong 4 làn; đề nghĩa tiếng
 * Việt ở trên, một hàng mây (mỗi làn một đáp án chữ Thái) trôi từ phải sang — dùng `↑` `↓` lái vào
 * mây đúng. Luật 3 tim như `rapid.ts`: mây sai mất 1 tim, hết tim → kết thúc. Mỗi câu đúng mây trôi
 * nhanh hơn 6% (tối đa ×2).
 */
import { availability, assertAvailable, cycle, type GameItemRef } from '../game';
import { START_LIVES } from '../rapid';
import { type GameSource, sourceRng } from '../source';
import {
  advance,
  arcadeAnswer,
  arcadeInitial,
  arcadeSummary,
  finishArcade,
  choiceOptions,
  cyclic,
  promptItems,
  type ArcadeGame,
  type ArcadeState,
  type PromptItem,
} from './arcade';

export const AIRPLANE_LANES = 4;
export const AIRPLANE_MIN_ITEMS = 6;
/** Vị trí ngang (0 = trái, 1 = phải) của máy bay; mây xuất phát ở 1. */
export const PLANE_X = 0.15;
/** Tốc độ mây ban đầu (bề ngang màn / giây) — ~3,4 s mỗi hàng. */
export const BASE_SPEED = 0.25;
export const SPEED_STEP = 0.06;
export const MAX_SPEED_FACTOR = 2;
/** Câu dài hơn chừng này thẻ từ không vừa đám mây. */
export const MAX_CLOUD_TOKENS = 3;
const POINTS = 100;
const QUESTIONS = 60;

export interface AirplaneQuestion {
  item: GameItemRef;
  th: string;
  /** Đề: nghĩa tiếng Việt. */
  vi: string;
  /** Đáp án trên từng làn (trên → dưới). */
  clouds: string[];
  answerLane: number;
}

export interface AirplaneRound {
  questions: AirplaneQuestion[];
}

export interface AirplaneState extends ArcadeState {
  questions: AirplaneQuestion[];
  index: number;
  /** Làn máy bay (0 = trên cùng). */
  lane: number;
  /** Vị trí ngang hàng mây hiện tại. */
  cloudX: number;
  lives: number;
  /** Tim thay đổi ở hàng mây vừa qua (UI làm hiệu ứng). */
  lifeDelta: -1 | 0;
}

export interface AirplaneInput {
  /** -1 = lên (`↑`), 1 = xuống (`↓`). */
  move: -1 | 1;
}

export const currentFlight = (state: AirplaneState) => cyclic(state.questions, state.index);

/** Làn trong số mây của câu (câu có thể ít mây hơn câu trước khi nguồn nhiều mục cùng nghĩa). */
const inLanes = (lane: number, question: AirplaneQuestion) =>
  Math.min(question.clouds.length - 1, Math.max(0, lane));

/** Tốc độ mây sau `correct` câu đúng. */
export const cloudSpeed = (correct: number) =>
  BASE_SPEED * Math.min(MAX_SPEED_FACTOR, 1 + SPEED_STEP * correct);

function items(source: GameSource): PromptItem[] {
  const short = new Set(
    source.sentences.filter((s) => s.tokens.length <= MAX_CLOUD_TOKENS).map((s) => s.id),
  );
  return promptItems(source).filter((i) => i.item.itemType === 'word' || short.has(i.item.itemId));
}

/** Mây chạm máy bay: chấm làn hiện tại, sang hàng mây mới (hoặc hết tim). */
function collide(state: AirplaneState): AirplaneState {
  const q = currentFlight(state);
  const correct = state.lane === q.answerLane;
  const given = q.clouds[state.lane]!;
  const s = arcadeAnswer(
    state,
    { item: q.item, correct, expected: q.th, ...(correct ? {} : { given }) },
    q.th,
    (combo) => POINTS * combo,
  );
  const lives = s.lives - (correct ? 0 : 1);
  const index = s.index + 1;
  const next: AirplaneState = {
    ...s,
    lives,
    lifeDelta: correct ? 0 : -1,
    index,
    cloudX: 1,
    lane: inLanes(s.lane, cyclic(s.questions, index)),
  };
  return lives <= 0 ? finishArcade(next) : next;
}

export const airplane: ArcadeGame<AirplaneRound, AirplaneInput, AirplaneState> = {
  id: 'airplane',

  availability: (source) =>
    availability('items', AIRPLANE_MIN_ITEMS, new Set(items(source).map((i) => i.th)).size),

  generateRound(source, seed) {
    assertAvailable(this.id, this.availability(source));
    const rng = sourceRng(seed, source);
    const all = items(source);
    return {
      questions: cycle(rng, all, QUESTIONS).map((target) => {
        const { options, answer } = choiceOptions(rng, all, target, AIRPLANE_LANES);
        return { ...target, clouds: options, answerLane: answer };
      }),
    };
  },

  start: (round) => ({
    ...arcadeInitial(),
    questions: round.questions,
    index: 0,
    lane: inLanes(1, round.questions[0]!),
    cloudX: 1,
    lives: START_LIVES,
    lifeDelta: 0,
  }),

  tick(state, dtMs, input) {
    if (state.status === 'finished') return state;
    const s = input
      ? { ...state, lane: inLanes(state.lane + input.move, currentFlight(state)) }
      : state;
    return advance(s, dtMs, (next, ms) => {
      const cloudX = next.cloudX - (cloudSpeed(next.correct) * ms) / 1000;
      // Dung sai số thực: cộng dồn nhiều bước nhỏ có thể dừng ngay trên `PLANE_X`.
      return cloudX <= PLANE_X + 1e-9 ? collide(next) : { ...next, cloudX };
    });
  },

  summary: (state) => arcadeSummary('airplane', state),
};
