import { describe, expect, it } from 'vitest';
import { dayKey, studyStreak } from './streak';

// Thứ Năm 2026-11-19, 10:00 giờ Việt Nam (UTC+7).
const NOW = new Date('2026-11-19T03:00:00Z');
const VN = 7 * 60;
const at = (day: string, hour = 9) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + (hour - 7) * 3_600_000).toISOString();

describe('chuỗi ngày học (M0.5c §2.4, Q4)', () => {
  it('chưa học gì → 0, hôm nay chưa học', () => {
    expect(studyStreak([], NOW, VN)).toMatchObject({ count: 0, today: false, milestone: null });
  });

  it('đếm ngày liên tiếp tới hôm nay; nhiều hoạt động một ngày = 1 ngày', () => {
    const s = studyStreak(
      [at('2026-11-17'), at('2026-11-18'), at('2026-11-18', 20), at('2026-11-19', 8)],
      NOW,
      VN,
    );
    expect(s).toMatchObject({ count: 3, today: true, milestone: 3 });
  });

  it('hôm nay chưa học: chuỗi giữ tới hôm qua (không phạt)', () => {
    const s = studyStreak([at('2026-11-17'), at('2026-11-18')], NOW, VN);
    expect(s).toMatchObject({ count: 2, today: false, milestone: null });
  });

  it('nghỉ một ngày → chuỗi đứt', () => {
    expect(studyStreak([at('2026-11-16'), at('2026-11-18')], NOW, VN).count).toBe(1);
  });

  it('ngày theo múi giờ địa phương: 23:30 giờ VN vẫn là ngày đó', () => {
    const late = at('2026-11-18', 23.5);
    expect(dayKey(Date.parse(late), VN)).toBe('2026-11-18');
    expect(dayKey(Date.parse(late))).toBe('2026-11-18');
    expect(studyStreak([late], NOW, VN).count).toBe(1);
  });

  it('tuần Thứ Hai → Chủ Nhật, đánh dấu hôm nay; bỏ mốc tương lai / hỏng', () => {
    const s = studyStreak([at('2026-11-16'), at('2026-11-20'), 'hỏng'], NOW, VN);
    expect(s.week.map((d) => d.day)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(s.week.map((d) => d.studied)).toEqual([true, false, false, false, false, false, false]);
    expect(s.week.findIndex((d) => d.isToday)).toBe(3);
  });
});
