/**
 * F-15 Đập chuột (plan 0.14, mẫu "whack-a-mole"): đề là nghĩa tiếng Việt; 9 ô (bố cục numpad),
 * các con vật thò lên mang chữ Thái — đập đúng từ để sang đề tiếp. 60 s; đúng liền → combo; đập
 * nhầm trừ điểm, mất combo, mục bị ghi "cần ôn". Lịch xuất hiện sinh sẵn theo seed.
 */
import { availability, assertAvailable, cycle, type GameItemRef } from '../game';
import { createRng } from '../rng';
import {
  advance,
  arcadeAnswer,
  arcadeInitial,
  arcadeSummary,
  finishArcade,
  promptItems,
  wrongOptions,
  type ArcadeGame,
  type ArcadeState,
} from './arcade';

export const WHACK_DURATION_MS = 60_000;
export const WHACK_HOLES = 9;
/** Cần ≥ chừng này chữ Thái khác nhau. */
export const WHACK_MIN_WORDS = 6;
/** Mỗi chừng này ms một con thò lên; mỗi con ở lại `MOLE_STAY_MS`. */
export const MOLE_INTERVAL_MS = 700;
export const MOLE_STAY_MS = 1_400;
/** Một chu kỳ lịch xuất hiện (lặp lại nếu người chơi chưa đập đúng). */
export const MOLES_PER_CYCLE = 9;
/** Mỗi nhóm 3 con có đúng 1 con mang đáp án. */
const GROUP = 3;
export const WHACK_POINTS = 100;
export const WHACK_PENALTY = 50;
const QUESTIONS = 60;
const DISTRACTORS = 4;

export interface Mole {
  /** 0–8 (hàng trên → dưới, trái → phải). */
  hole: number;
  th: string;
  /** Thò lên sau chừng này ms kể từ đầu chu kỳ. */
  at: number;
}

export interface WhackQuestion {
  item: GameItemRef;
  th: string;
  /** Đề: nghĩa tiếng Việt. */
  vi: string;
  moles: Mole[];
}

export interface WhackRound {
  questions: WhackQuestion[];
}

export interface WhackState extends ArcadeState {
  questions: WhackQuestion[];
  index: number;
  /** Đồng hồ lúc đề hiện tại bắt đầu. */
  questionStartMs: number;
  /** Con đã bị đập ở đề hiện tại (khóa `chu kỳ × MOLES_PER_CYCLE + thứ tự`) — UI ẩn đi. */
  whacked: number[];
}

export interface WhackInput {
  /** Ô bị đập (0–8). */
  hit: number;
}

export interface ActiveMole extends Mole {
  key: number;
}

export const currentWhack = (state: WhackState) =>
  state.questions[state.index % state.questions.length]!;

/** Các con đang thò lên (chưa bị đập) tại đồng hồ hiện tại. */
export function activeMoles(state: WhackState): ActiveMole[] {
  const q = currentWhack(state);
  const period = MOLES_PER_CYCLE * MOLE_INTERVAL_MS;
  const rel = state.elapsedMs - state.questionStartMs;
  const out: ActiveMole[] = [];
  q.moles.forEach((mole, i) => {
    // Chu kỳ hiện tại và chu kỳ trước (con cuối chu kỳ trước còn ở lại sang chu kỳ sau).
    const c = Math.floor((rel - mole.at) / period);
    for (const k of [c, c - 1]) {
      if (k < 0) continue;
      const shown = rel - (mole.at + k * period);
      const key = k * MOLES_PER_CYCLE + i;
      if (shown >= 0 && shown < MOLE_STAY_MS && !state.whacked.includes(key)) {
        out.push({ ...mole, key });
      }
    }
  });
  return out;
}

function schedule(rng: ReturnType<typeof createRng>, answer: string, others: string[]): Mole[] {
  const moles: Mole[] = [];
  for (let g = 0; g < MOLES_PER_CYCLE / GROUP; g++) {
    const target = rng.int(GROUP);
    for (let j = 0; j < GROUP; j++) {
      const i = g * GROUP + j;
      // Không thò cùng ô với con trước (còn đang ở lại) — kể cả nối chu kỳ (con đầu ↔ con cuối).
      const busy = new Set([moles[i - 1]?.hole, i === MOLES_PER_CYCLE - 1 ? moles[0]!.hole : -1]);
      const free = [...Array(WHACK_HOLES).keys()].filter((h) => !busy.has(h));
      moles.push({
        hole: free[rng.int(free.length)]!,
        th: j === target ? answer : others[rng.int(others.length)]!,
        at: i * MOLE_INTERVAL_MS,
      });
    }
  }
  return moles;
}

function nextQuestion(state: WhackState): WhackState {
  return { ...state, index: state.index + 1, questionStartMs: state.elapsedMs, whacked: [] };
}

export const whackAMole: ArcadeGame<WhackRound, WhackInput, WhackState> = {
  id: 'whack-a-mole',

  availability: (source) =>
    availability(
      'words',
      WHACK_MIN_WORDS,
      new Set(promptItems(source, true, false).map((i) => i.th)).size,
    ),

  generateRound(source, seed) {
    assertAvailable(this.id, this.availability(source));
    const rng = createRng(seed);
    const items = promptItems(source, true, false);
    return {
      questions: cycle(rng, items, QUESTIONS).map((target) => {
        const others = rng.shuffle(wrongOptions(items, target)).slice(0, DISTRACTORS);
        return { ...target, moles: schedule(rng, target.th, others) };
      }),
    };
  },

  start: (round) => ({
    ...arcadeInitial(),
    questions: round.questions,
    index: 0,
    questionStartMs: 0,
    whacked: [],
  }),

  tick(state, dtMs, input) {
    if (state.status === 'finished') return state;
    let s = state;
    const mole = input && activeMoles(s).find((m) => m.hole === input.hit);
    if (mole) {
      const q = currentWhack(s);
      const correct = mole.th === q.th;
      s = arcadeAnswer(
        s,
        { item: q.item, correct, expected: q.th, ...(correct ? {} : { given: mole.th }) },
        q.th,
        (combo) => WHACK_POINTS * combo,
      );
      s = correct
        ? nextQuestion(s)
        : {
            ...s,
            score: Math.max(0, s.score - WHACK_PENALTY),
            whacked: [...s.whacked, mole.key],
          };
    }
    return advance(s, dtMs, (next) =>
      next.elapsedMs >= WHACK_DURATION_MS ? finishArcade(next) : next,
    );
  },

  summary: (state) => arcadeSummary('whack-a-mole', state),
};
