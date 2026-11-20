/**
 * Trò "arcade" (plan 0.14, M9.6): có chuyển động hoặc đồng hồ chạy liên tục. Trạng thái là dữ liệu
 * thuần; thời gian đi vào qua `dtMs` (UI gọi mỗi khung hình, dừng khi tab ẩn) nên test chạy bằng
 * seed + đồng hồ giả, không phụ thuộc tốc độ khung hình (`advance` chia `dtMs` thành bước cố định).
 * Như mọi trò chơi: không đổi lịch FSRS (F-12), mục sai → "cần ôn".
 */
import {
  applyAnswer,
  initialState,
  summarize,
  type GameAvailability,
  type GameFeedback,
  type GameItemRef,
  type GameState,
  type GameSummary,
} from '../game';
import type { Rng } from '../rng';
import type { GameSource } from '../source';

export const ARCADE_GAME_IDS = ['whack-a-mole', 'gameshow', 'airplane', 'maze'] as const;
export type ArcadeGameId = (typeof ARCADE_GAME_IDS)[number];

/** Bước mô phỏng tối đa (ms): khung hình dài (máy chậm) được chia nhỏ → kết quả như nhau. */
export const LOOP_STEP_MS = 50;

export interface ArcadeState extends GameState {
  /** Đồng hồ trò chơi (ms) — tổng các `dtMs` đã chạy. */
  elapsedMs: number;
}

export interface ArcadeGame<Round, Input, State extends ArcadeState> {
  readonly id: ArcadeGameId;
  availability(source: GameSource): GameAvailability;
  /** Throw nếu nguồn không đủ dữ liệu (`availability`). */
  generateRound(source: GameSource, seed: number): Round;
  start(round: Round): State;
  /**
   * Chạy `dtMs` (≥ 0) với thao tác `input` của người chơi trong khung hình này (áp dụng trước,
   * rồi mới cho thời gian trôi). Trạng thái `finished` trả về nguyên.
   */
  tick(state: State, dtMs: number, input?: Input): State;
  summary(state: State): GameSummary<ArcadeGameId>;
}

/**
 * Cho `dtMs` trôi qua theo bước ≤ `LOOP_STEP_MS`: `step(state, ms)` gọi lần lượt, dừng sớm khi
 * trò kết thúc.
 */
export function advance<S extends ArcadeState>(
  state: S,
  dtMs: number,
  step: (state: S, ms: number) => S,
): S {
  let s = state;
  // Infinity / NaN (đồng hồ hỏng) → không chạy, tránh lặp vô hạn.
  let left = Number.isFinite(dtMs) ? Math.max(0, dtMs) : 0;
  while (left > 0 && s.status !== 'finished') {
    const ms = Math.min(LOOP_STEP_MS, left);
    s = step({ ...s, elapsedMs: s.elapsedMs + ms }, ms);
    left -= ms;
  }
  return s;
}

export function arcadeInitial(): ArcadeState {
  return { ...initialState(0), elapsedMs: 0 };
}

/** Kết thúc tại đồng hồ hiện tại. */
export function finishArcade<S extends ArcadeState>(state: S): S {
  return state.status === 'finished'
    ? state
    : { ...state, status: 'finished', finishedAt: state.elapsedMs, feedback: null };
}

/**
 * Ghi một câu trả lời (combo, điểm, mục sai) nhưng giữ trò đang chạy (`playing`) — trò arcade
 * không dừng ở màn phản hồi; `feedback` chỉ để UI nháy hiệu ứng.
 */
export function arcadeAnswer<S extends ArcadeState>(
  state: S,
  feedback: Omit<GameFeedback, 'points'>,
  th: string,
  points: (combo: number) => number,
): S {
  return { ...applyAnswer(state, feedback, th, points), status: 'playing' };
}

export function arcadeSummary(id: ArcadeGameId, state: ArcadeState): GameSummary<ArcadeGameId> {
  return summarize(id, state, state.finishedAt ?? state.elapsedMs);
}

/** Mục nguồn dùng làm đề "nghĩa → chữ Thái" (từ + câu có đáp án). */
export interface PromptItem {
  item: GameItemRef;
  th: string;
  /** Nghĩa / bản dịch tiếng Việt. */
  vi: string;
}

export function promptItems(source: GameSource, words = true, sentences = true): PromptItem[] {
  return [
    ...(words
      ? source.words.map((w) => ({
          item: { itemType: 'word' as const, itemId: w.id },
          th: w.thai,
          vi: w.meanings.join('; '),
        }))
      : []),
    ...(sentences
      ? source.sentences.map((s) => ({
          item: { itemType: 'sentence' as const, itemId: s.id },
          th: s.th,
          vi: s.vi,
        }))
      : []),
  ];
}

/** Câu thứ `index` của lượt (quay vòng khi chơi hết danh sách). */
export const cyclic = <T>(questions: readonly T[], index: number): T =>
  questions[index % questions.length]!;

/**
 * Lựa chọn chữ Thái cho `target`: đáp án + tối đa `count − 1` nhiễu (`wrongOptions`), đã xáo.
 * Nguồn có nhiều mục cùng nghĩa có thể cho ít hơn `count` lựa chọn.
 */
export function choiceOptions(
  rng: Rng,
  items: readonly PromptItem[],
  target: PromptItem,
  count: number,
): { options: string[]; answer: number } {
  const wrong = rng.shuffle(wrongOptions(items, target)).slice(0, count - 1);
  const options = rng.shuffle([target.th, ...wrong]);
  return { options, answer: options.indexOf(target.th) };
}

/**
 * Đáp án nhiễu cho `target`: chữ Thái của mục khác, không trùng chữ và không cùng nghĩa với đáp
 * án (tránh hai lựa chọn cùng đúng).
 */
export function wrongOptions(items: readonly PromptItem[], target: PromptItem): string[] {
  const valid = new Set(items.filter((i) => i.vi === target.vi).map((i) => i.th));
  return [...new Set(items.filter((i) => !valid.has(i.th)).map((i) => i.th))];
}
