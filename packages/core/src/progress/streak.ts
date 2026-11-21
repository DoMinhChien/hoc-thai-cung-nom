/**
 * Chuỗi ngày học (M0.5c §2.4, Q4 owner 2026-11-21): một ngày "có học" khi có ít nhất một hoạt động
 * có chấm điểm — bài tập, ôn thẻ, bước bài học, lượt trò chơi. Hôm nay chưa học không làm đứt chuỗi
 * (chuỗi tính tới hôm qua, `today: false`) — không phạt, không đếm ngược.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Mốc chuỗi có hiệu ứng `fb-record` (một lần khi vừa đạt). */
export const STREAK_MILESTONES = [3, 7, 30, 100] as const;

/** Khóa ngày `YYYY-MM-DD` theo múi giờ `utcOffsetMinutes` (UI truyền offset của trình duyệt). */
export function dayKey(ms: number, utcOffsetMinutes = 0): string {
  return new Date(ms + utcOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

export interface StudyStreak {
  /** Số ngày liên tiếp có học, tính tới hôm nay (nếu hôm nay đã học) hoặc hôm qua. */
  count: number;
  /** Hôm nay đã có hoạt động. */
  today: boolean;
  /** Tuần hiện tại (Thứ Hai → Chủ Nhật): ngày nào có học. */
  week: { day: string; studied: boolean; isToday: boolean }[];
  /** Hôm nay vừa đạt mốc (`STREAK_MILESTONES`) — chỉ khi `today`. */
  milestone: number | null;
  /** Chuỗi dài nhất trong mọi mốc đã đưa vào (SCR-09). */
  longest: number;
  /** Mọi ngày có học (`YYYY-MM-DD`, tăng dần). */
  days: string[];
}

/**
 * Chuỗi ngày học từ thời điểm các hoạt động (ISO). `timestamps` không cần sắp xếp; mốc tương lai
 * (đồng hồ máy lệch) bị bỏ.
 */
export function studyStreak(
  timestamps: Iterable<string>,
  now: Date,
  utcOffsetMinutes = 0,
): StudyStreak {
  const nowMs = now.getTime();
  const key = (ms: number) => dayKey(ms, utcOffsetMinutes);
  const days = new Set<string>();
  for (const ts of timestamps) {
    const ms = Date.parse(ts);
    if (Number.isFinite(ms) && ms <= nowMs) days.add(key(ms));
  }

  const todayKey = key(nowMs);
  const today = days.has(todayKey);
  let count = 0;
  for (let ms = today ? nowMs : nowMs - DAY_MS; days.has(key(ms)); ms -= DAY_MS) count++;

  // Thứ trong tuần theo ngày địa phương: 0 = Thứ Hai.
  const weekday = (new Date(nowMs + utcOffsetMinutes * 60_000).getUTCDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = key(nowMs + (i - weekday) * DAY_MS);
    return { day, studied: days.has(day), isToday: day === todayKey };
  });
  const milestone =
    today && (STREAK_MILESTONES as readonly number[]).includes(count) ? count : null;
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  sorted.forEach((day, i) => {
    const prev = sorted[i - 1];
    run = prev && Date.parse(day) - Date.parse(prev) === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return { count, today, week, milestone, longest, days: sorted };
}
