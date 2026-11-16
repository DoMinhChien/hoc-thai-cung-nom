import { describe, expect, it } from 'vitest';
import type { ListeningStatRecord } from '../data/records';
import { newSrsState, type SrsState } from '../srs/srs';
import {
  accuracyBy,
  completionPercent,
  countMastery,
  dailyAccuracy,
  itemMastery,
  MASTERY_THRESHOLD_DAYS,
  masteryLevel,
} from './progress';

const T0 = new Date('2026-03-01T08:00:00.000Z');
const srs = (patch: Partial<SrsState>): SrsState => ({ ...newSrsState(T0), ...patch });
const LEARNING = srs({ state: 'learning', stability: 2 });
const RELEARNING = srs({ state: 'relearning', stability: 30 });
const KNOWN = srs({ state: 'review', stability: 20.9 });
const MASTERED = srs({ state: 'review', stability: 21 });

describe('masteryLevel (bảng 4.9)', () => {
  it.each([
    [undefined, 'none'],
    [srs({}), 'none'],
    [LEARNING, 'learning'],
    [RELEARNING, 'learning'],
    [KNOWN, 'known'],
    [MASTERED, 'mastered'],
  ] as const)('%o → %s', (state, level) => {
    expect(masteryLevel(state)).toBe(level);
  });

  it('ngưỡng 21 ngày cấu hình được', () => {
    expect(MASTERY_THRESHOLD_DAYS).toBe(21);
    expect(masteryLevel(KNOWN, 14)).toBe('mastered');
    expect(masteryLevel(MASTERED, 30)).toBe('known');
  });
});

describe('countMastery / itemMastery', () => {
  const cards = [
    { itemId: 'a', fsrs: MASTERED },
    { itemId: 'b', fsrs: KNOWN },
    { itemId: 'c', fsrs: LEARNING },
    // d: 2 thẻ, lấy mức thấp nhất
    { itemId: 'd', fsrs: MASTERED },
    { itemId: 'd', fsrs: LEARNING },
    // thẻ của mục ngoài tập → bỏ qua
    { itemId: 'x', fsrs: MASTERED },
  ];

  it('đếm 4 mức trên tập mục; mục chưa có thẻ = none', () => {
    expect(countMastery(['a', 'b', 'c', 'd', 'e'], cards)).toEqual({
      none: 1,
      learning: 2,
      known: 1,
      mastered: 1,
      total: 5,
    });
  });

  it('itemMastery giữ thứ tự mục', () => {
    expect([...itemMastery(['e', 'd', 'a'], cards)]).toEqual([
      ['e', 'none'],
      ['d', 'learning'],
      ['a', 'mastered'],
    ]);
  });

  it('ngưỡng truyền xuống', () => {
    expect(countMastery(['b'], cards, 10).mastered).toBe(1);
  });

  it('completionPercent: (đang nhớ + đã thuộc) / tổng, làm tròn xuống; tổng 0 → 0', () => {
    expect(completionPercent(countMastery(['a', 'b', 'c'], cards))).toBe(66);
    expect(completionPercent(countMastery([], cards))).toBe(0);
    expect(completionPercent(countMastery(['a'], cards))).toBe(100);
  });
});

describe('accuracy', () => {
  it('accuracyBy giữ thứ tự khóa, khóa chưa có lượt → ratio null, khóa lạ vẫn đếm', () => {
    const result = accuracyBy(
      [
        { key: 'x', correct: true },
        { key: 'x', correct: false },
        { key: 'z', correct: true },
      ],
      ['y', 'x'],
    );
    expect(Object.keys(result)).toEqual(['y', 'x', 'z']);
    expect(result.x).toEqual({ correct: 1, total: 2, ratio: 0.5 });
    expect(result.y).toEqual({ correct: 0, total: 0, ratio: null });
  });

  const stat = (expectedTone: ListeningStatRecord['expectedTone'], correct: boolean, ts: string) =>
    ({
      id: ts,
      expectedTone,
      answeredTone: correct ? expectedTone : 'mid',
      correct,
      ts,
      updatedAt: ts,
    }) satisfies ListeningStatRecord;

  it('dailyAccuracy: 7 ngày cũ → mới, bỏ lượt ngoài khoảng, theo múi giờ', () => {
    const stats = [
      stat('mid', true, '2026-03-01T07:00:00Z'),
      stat('mid', false, '2026-02-28T23:30:00Z'),
      stat('mid', true, '2026-02-20T10:00:00Z'),
    ];
    const utc = dailyAccuracy(stats, T0);
    expect(utc.map((d) => d.day)).toEqual([
      '2026-02-23',
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
    expect(utc[6]!.accuracy).toEqual({ correct: 1, total: 1, ratio: 1 });
    expect(utc[5]!.accuracy.total).toBe(1);
    expect(utc[0]!.accuracy.ratio).toBeNull();

    // UTC+7: 23:30Z ngày 28/02 là 06:30 ngày 01/03 giờ Việt Nam.
    const vn = dailyAccuracy(stats, T0, 7, 7 * 60);
    expect(vn[6]).toEqual({ day: '2026-03-01', accuracy: { correct: 1, total: 2, ratio: 0.5 } });
  });
});
