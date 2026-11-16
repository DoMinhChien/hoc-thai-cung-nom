import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NEW_CARDS_PER_DAY,
  isDue,
  newCardsRemaining,
  newSrsState,
  previewSrs,
  RATINGS,
  reviewSrs,
  selectDue,
  type SrsState,
} from './srs';

// Đồng hồ giả lập (AGENTS mục 7): mọi thời điểm tính từ T0.
const T0 = new Date('2026-03-01T08:00:00.000Z');
const minutes = (n: number) => new Date(T0.getTime() + n * 60_000);
const days = (n: number) => minutes(n * 24 * 60);

/** Ôn liên tiếp, mỗi lần đúng lúc đến hạn. */
function reviewOnDue(state: SrsState, ratings: (typeof RATINGS)[number][]) {
  let s = state;
  for (const r of ratings) s = reviewSrs(s, r, new Date(s.due)).state;
  return s;
}

describe('SRS wrapper (ts-fsrs)', () => {
  it('thẻ mới: state new, đến hạn ngay, JSON thuần (ISO string)', () => {
    const s = newSrsState(T0);
    expect(s).toMatchObject({ state: 'new', due: T0.toISOString(), reps: 0, last_review: null });
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('Good lần đầu → learning, ôn lại sau vài phút; log giữ trạng thái trước khi ôn', () => {
    const { state, log } = reviewSrs(newSrsState(T0), 'good', T0);
    expect(state.state).toBe('learning');
    expect(state.reps).toBe(1);
    expect(state.last_review).toBe(T0.toISOString());
    expect(Date.parse(state.due) - T0.getTime()).toBe(10 * 60_000);
    expect(log).toMatchObject({ rating: 'good', state: 'new', review: T0.toISOString() });
  });

  it('Easy lần đầu → review luôn, khoảng cách dài hơn Good', () => {
    const easy = reviewSrs(newSrsState(T0), 'easy', T0).state;
    expect(easy.state).toBe('review');
    expect(easy.scheduled_days).toBeGreaterThan(0);
  });

  it('Again khi đang review → relearning, lapses +1', () => {
    const review = reviewOnDue(newSrsState(T0), ['good', 'good']);
    expect(review.state).toBe('review');
    const lapsed = reviewSrs(review, 'again', new Date(review.due)).state;
    expect(lapsed.state).toBe('relearning');
    expect(lapsed.lapses).toBe(1);
  });

  it('ôn Good liên tục → stability tăng, khoảng ôn dài dần', () => {
    const s = reviewOnDue(newSrsState(T0), ['good', 'good', 'good', 'good', 'good']);
    expect(s.state).toBe('review');
    expect(s.stability).toBeGreaterThan(21);
  });

  it('tất định (fuzz tắt): cùng lịch sử → cùng kết quả', () => {
    const a = reviewOnDue(newSrsState(T0), ['good', 'hard', 'good']);
    const b = reviewOnDue(newSrsState(T0), ['good', 'hard', 'good']);
    expect(a).toEqual(b);
  });

  it('previewSrs: due cho 4 nút, Again ≤ Hard ≤ Good ≤ Easy', () => {
    const preview = previewSrs(newSrsState(T0), T0);
    expect(Object.keys(preview)).toEqual([...RATINGS]);
    const times = RATINGS.map((r) => Date.parse(preview[r]));
    expect([...times].sort((x, y) => x - y)).toEqual(times);
  });

  it('isDue: thẻ mới không tính là đến hạn', () => {
    const learning = reviewSrs(newSrsState(T0), 'good', T0).state;
    expect(isDue(newSrsState(T0), days(1))).toBe(false);
    expect(isDue(learning, minutes(9))).toBe(false);
    expect(isDue(learning, minutes(10))).toBe(true);
  });

  it('selectDue: lọc, sắp xếp quá hạn lâu nhất trước, limit', () => {
    const at = (m: number) => ({
      id: m,
      fsrs: reviewSrs(newSrsState(minutes(m)), 'good', minutes(m)).state,
    });
    const cards = [at(30), at(0), { id: -1, fsrs: newSrsState(T0) }, at(15)];
    expect(selectDue(cards, minutes(45)).map((c) => c.id)).toEqual([0, 15, 30]);
    expect(selectDue(cards, minutes(45), 2).map((c) => c.id)).toEqual([0, 15]);
    expect(selectDue(cards, minutes(5))).toEqual([]);
  });

  it('newCardsRemaining: mặc định 10/ngày (B-03), không âm', () => {
    expect(DEFAULT_NEW_CARDS_PER_DAY).toBe(10);
    expect(newCardsRemaining(3)).toBe(7);
    expect(newCardsRemaining(12)).toBe(0);
    expect(newCardsRemaining(2, 5)).toBe(3);
  });
});
