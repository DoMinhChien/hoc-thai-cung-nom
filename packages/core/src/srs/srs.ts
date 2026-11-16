/**
 * SRS wrapper trên `ts-fsrs` (B-04). Trạng thái lưu dạng JSON thuần (ngày = ISO string) để
 * ghi thẳng vào IndexedDB, export/import (M12) và đồng bộ (Phase 2). Mọi hàm nhận `now` —
 * test dùng đồng hồ giả lập.
 */
import {
  createEmptyCard,
  fsrs,
  Rating as FsrsRating,
  type Card as FsrsCard,
  type Grade,
  type ReviewLog as FsrsReviewLog,
} from 'ts-fsrs';

/** 4 nút ôn (B-04). */
export const RATINGS = ['again', 'hard', 'good', 'easy'] as const;
export type SrsRating = (typeof RATINGS)[number];

/** Trạng thái FSRS (R-03: New / Learning / Review / Relearning). */
export const SRS_STATES = ['new', 'learning', 'review', 'relearning'] as const;
export type SrsStateName = (typeof SRS_STATES)[number];

export interface SrsState {
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: SrsStateName;
  last_review: string | null;
}

/** Dữ liệu một lần ôn (trạng thái *trước* khi ôn, như ReviewLog của FSRS). */
export interface SrsLog {
  rating: SrsRating;
  state: SrsStateName;
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  review: string;
}

/** B-03: số thẻ mới mỗi ngày mặc định. */
export const DEFAULT_NEW_CARDS_PER_DAY = 10;

const GRADE: Record<SrsRating, Grade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};

// Fuzz tắt: cùng lịch sử → cùng lịch ôn (test lặp lại được, sync Phase 2 không lệch).
const scheduler = fsrs({ enable_fuzz: false });

const iso = (d: Date) => d.toISOString();

function toFsrs(s: SrsState): FsrsCard {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: SRS_STATES.indexOf(s.state),
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  } as FsrsCard;
}

function fromFsrs(c: FsrsCard): SrsState {
  return {
    due: iso(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: SRS_STATES[c.state]!,
    last_review: c.last_review ? iso(c.last_review) : null,
  };
}

function fromFsrsLog(log: FsrsReviewLog, rating: SrsRating): SrsLog {
  return {
    rating,
    state: SRS_STATES[log.state]!,
    due: iso(log.due),
    stability: log.stability,
    difficulty: log.difficulty,
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    review: iso(log.review),
  };
}

/** Thẻ mới, đến hạn ngay. */
export function newSrsState(now: Date): SrsState {
  return fromFsrs(createEmptyCard(now));
}

/** Ôn một lần → trạng thái mới + log. */
export function reviewSrs(
  state: SrsState,
  rating: SrsRating,
  now: Date,
): { state: SrsState; log: SrsLog } {
  const result = scheduler.next(toFsrs(state), now, GRADE[rating]);
  return { state: fromFsrs(result.card), log: fromFsrsLog(result.log, rating) };
}

/** Lịch ôn kế tiếp của từng nút — để hiện "10 phút / 1 ngày…" dưới nút. */
export function previewSrs(state: SrsState, now: Date): Record<SrsRating, string> {
  const preview = scheduler.repeat(toFsrs(state), now);
  return Object.fromEntries(
    RATINGS.map((r) => [r, iso(preview[GRADE[r]].card.due)] as const),
  ) as Record<SrsRating, string>;
}

export function isDue(state: SrsState, now: Date): boolean {
  return state.state !== 'new' && Date.parse(state.due) <= now.getTime();
}

/** Thẻ đến hạn (không tính thẻ mới), quá hạn lâu nhất trước. */
export function selectDue<T extends { fsrs: SrsState }>(cards: T[], now: Date, limit?: number) {
  const due = cards
    .filter((c) => isDue(c.fsrs, now))
    .sort((a, b) => a.fsrs.due.localeCompare(b.fsrs.due));
  return limit === undefined ? due : due.slice(0, limit);
}

/** B-03: còn được học bao nhiêu thẻ mới hôm nay. */
export function newCardsRemaining(introducedToday: number, perDay = DEFAULT_NEW_CARDS_PER_DAY) {
  return Math.max(0, perDay - introducedToday);
}
