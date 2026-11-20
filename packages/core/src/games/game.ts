/**
 * Interface `Game` (plan F-14): mỗi trò là module độc lập — thêm trò mới không sửa phần khác.
 * Trạng thái là dữ liệu thuần, bất biến; thời gian là tham số `now` (ms của đồng hồ trò chơi —
 * UI tạm dừng thì đồng hồ dừng), nên test dùng đồng hồ giả. Trò chơi **không** đổi lịch FSRS (F-12).
 */
import type { AnyGameId } from './catalog';
import type { Rng } from './rng';
import type { GameSource } from './source';

export const GAME_IDS = ['match', 'true-false', 'sentence-rush', 'classifier-rush'] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameItemRef {
  itemType: 'word' | 'sentence';
  itemId: string;
}

/** Mục trả lời sai → kết quả lượt + cờ "cần ôn" (F-11, F-12). */
export interface GameMistake extends GameItemRef {
  /** Chữ Thái của mục. */
  th: string;
  /** Đáp án đúng (nghĩa, câu, loại từ). */
  expected: string;
  /** Người chơi đã chọn; không có khi hết giờ. */
  given?: string;
}

/** Số liệu một lượt — cũng là dạng lưu kỷ lục. */
export interface GameStats {
  score: number;
  correct: number;
  total: number;
  /** Chuỗi đúng liên tiếp dài nhất, tính tới ×5 (0 = chưa đúng câu nào). */
  maxCombo: number;
  durationMs: number;
}

export interface GameSummary<Id extends string = GameId> extends GameStats {
  gameId: Id;
  /** correct / total, 0–1 (0 khi chưa trả lời câu nào). */
  accuracy: number;
  /** Mỗi mục một lần, theo thứ tự sai. */
  mistakes: GameMistake[];
}

/** Lý do khóa trò: nguồn thiếu từ có nghĩa / câu có thẻ từ / từ có loại từ. */
export type GameLockReason = 'words' | 'sentences' | 'classifiers';
export type GameAvailability =
  { ok: true } | { ok: false; reason: GameLockReason; need: number; have: number };

/** Phản hồi câu vừa trả lời (UI hiện icon + chữ). */
export interface GameFeedback {
  item: GameItemRef;
  correct: boolean;
  expected: string;
  given?: string;
  points: number;
}

export type GameStatus = 'playing' | 'feedback' | 'finished';

export interface GameState {
  status: GameStatus;
  startedAt: number;
  finishedAt: number | null;
  score: number;
  /** Hệ số combo hiện tại (0 = chưa có câu đúng liên tiếp), tối đa `MAX_COMBO`. */
  combo: number;
  maxCombo: number;
  correct: number;
  total: number;
  mistakes: GameMistake[];
  feedback: GameFeedback | null;
}

export interface Game<Round, Answer, State extends GameState> {
  readonly id: GameId;
  /** Thời lượng lượt (ms) khi đếm ngược; `null` = đếm lên tới khi xong. */
  readonly durationMs: number | null;
  availability(source: GameSource): GameAvailability;
  /** Throw nếu nguồn không đủ dữ liệu (`availability`). */
  generateRound(source: GameSource, seed: number): Round;
  start(round: Round, now: number): State;
  /** Chỉ nhận khi `status === 'playing'`; trạng thái khác trả về nguyên. */
  answer(state: State, answer: Answer, now: number): State;
  /** Hết giờ câu / lượt. */
  tick(state: State, now: number): State;
  /** Rời màn phản hồi sang câu tiếp (hoặc kết thúc). */
  next(state: State, now: number): State;
  score(state: State): number;
  summary(state: State): GameSummary;
}

export const MAX_COMBO = 5;

export function initialState(now: number): GameState {
  return {
    status: 'playing',
    startedAt: now,
    finishedAt: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    total: 0,
    mistakes: [],
    feedback: null,
  };
}

/**
 * Ghi một câu trả lời: đúng → combo +1 (tối đa ×5), sai → combo về 0 + thêm mục sai.
 * `points` nhận hệ số combo **sau** khi tăng (câu đúng đầu tiên ×1).
 */
export function applyAnswer<S extends GameState>(
  state: S,
  feedback: Omit<GameFeedback, 'points'>,
  th: string,
  points: (combo: number) => number,
): S {
  const combo = feedback.correct ? Math.min(MAX_COMBO, state.combo + 1) : 0;
  const gained = feedback.correct ? points(combo) : 0;
  const { item, expected, given } = feedback;
  return {
    ...state,
    status: 'feedback',
    score: state.score + gained,
    combo,
    maxCombo: Math.max(state.maxCombo, combo),
    correct: state.correct + (feedback.correct ? 1 : 0),
    total: state.total + 1,
    mistakes: feedback.correct
      ? state.mistakes
      : [...state.mistakes, { ...item, th, expected, ...(given === undefined ? {} : { given }) }],
    feedback: { ...feedback, points: gained },
  };
}

export function finish<S extends GameState>(state: S, now: number): S {
  return state.status === 'finished'
    ? state
    : { ...state, status: 'finished', finishedAt: now, feedback: null };
}

export function summarize<Id extends string = GameId>(
  gameId: Id,
  state: GameState,
  durationMs: number,
): GameSummary<Id> {
  const seen = new Set<string>();
  const mistakes = state.mistakes.filter((m) => {
    const key = `${m.itemType}:${m.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    gameId,
    score: state.score,
    correct: state.correct,
    total: state.total,
    accuracy: state.total === 0 ? 0 : state.correct / state.total,
    maxCombo: state.maxCombo,
    durationMs,
    mistakes,
  };
}

/**
 * `a` tốt hơn kỷ lục `b`? Ghép cặp: nhanh hơn (cùng thời gian → ít lượt lật hơn, tức điểm cao
 * hơn). Trò khác: điểm cao hơn.
 */
export function isBetterResult(gameId: AnyGameId, a: GameStats, b: GameStats): boolean {
  if (gameId === 'match') {
    return a.durationMs !== b.durationMs ? a.durationMs < b.durationMs : a.score > b.score;
  }
  return a.score > b.score;
}

export function availability(reason: GameLockReason, need: number, have: number): GameAvailability {
  return have >= need ? { ok: true } : { ok: false, reason, need, have };
}

export function assertAvailable(game: string, result: GameAvailability) {
  if (!result.ok) {
    throw new Error(
      `${game}: nguồn thiếu dữ liệu (${result.reason}: ${result.have}/${result.need})`,
    );
  }
}

/** Dãy `length` mục lấy lần lượt từ các lượt xáo trộn (đủ cho trò đếm ngược 60 s). */
export function cycle<T>(rng: Rng, items: readonly T[], length: number): T[] {
  const out: T[] = [];
  while (out.length < length) out.push(...rng.shuffle(items));
  return out.slice(0, length);
}
