/**
 * Selector tiến độ thuần (plan 4.9): input cards/logs/content → số liệu cho component progress.
 * Không phụ thuộc React/Dexie; mọi hàm có `now` nhận đồng hồ từ ngoài.
 */
import type { ListeningStatRecord } from '../data/records';
import { ToneSchema, type Tone } from '../schema/common';
import type { SrsState } from '../srs/srs';

/** 4 mức thuộc dùng thống nhất toàn app (bảng 4.9). */
export const MASTERY_LEVELS = ['none', 'learning', 'known', 'mastered'] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

/** Ngưỡng "Đã thuộc": stability ≥ 21 ngày (cấu hình được). */
export const MASTERY_THRESHOLD_DAYS = 21;

/**
 * Mức thuộc của một mục theo thẻ SRS của nó.
 * Chưa có thẻ hoặc thẻ còn ở state New (chưa ôn lần nào) → "Chưa học".
 */
export function masteryLevel(
  srs: SrsState | undefined,
  thresholdDays = MASTERY_THRESHOLD_DAYS,
): MasteryLevel {
  if (!srs || srs.state === 'new') return 'none';
  if (srs.state === 'learning' || srs.state === 'relearning') return 'learning';
  return srs.stability >= thresholdDays ? 'mastered' : 'known';
}

export type MasteryCounts = Record<MasteryLevel, number> & { total: number };

/**
 * Đếm 4 mức cho một tập mục (module, deck, nhóm chữ). Một mục có nhiều thẻ (B-05: nhiều loại
 * thẻ) lấy mức **thấp nhất** — chỉ "đã thuộc" khi thuộc mọi chiều đã học.
 */
export function countMastery(
  itemIds: readonly string[],
  cards: readonly { itemId: string; fsrs: SrsState }[],
  thresholdDays = MASTERY_THRESHOLD_DAYS,
): MasteryCounts {
  const levels = itemMastery(itemIds, cards, thresholdDays);
  const counts: MasteryCounts = { none: 0, learning: 0, known: 0, mastered: 0, total: 0 };
  for (const level of levels.values()) {
    counts[level] += 1;
    counts.total += 1;
  }
  return counts;
}

/** Mức thuộc từng mục (cho MasteryGrid P-02, chấm màu P-04). */
export function itemMastery(
  itemIds: readonly string[],
  cards: readonly { itemId: string; fsrs: SrsState }[],
  thresholdDays = MASTERY_THRESHOLD_DAYS,
): Map<string, MasteryLevel> {
  const byItem = new Map<string, SrsState[]>();
  for (const card of cards) {
    const list = byItem.get(card.itemId);
    if (list) list.push(card.fsrs);
    else byItem.set(card.itemId, [card.fsrs]);
  }
  const rank = (l: MasteryLevel) => MASTERY_LEVELS.indexOf(l);
  return new Map(
    itemIds.map((id) => {
      const states = byItem.get(id) ?? [];
      const level = states
        .map((s) => masteryLevel(s, thresholdDays))
        .reduce<MasteryLevel | null>((min, l) => (min && rank(min) <= rank(l) ? min : l), null);
      return [id, level ?? 'none'] as const;
    }),
  );
}

/**
 * % hoàn thành của module (P-01, vòng tròn): mục "Đang nhớ" + "Đã thuộc" trên tổng.
 * Tổng 0 → 0. Làm tròn xuống để 100% chỉ khi xong thật.
 */
export function completionPercent(counts: MasteryCounts): number {
  if (counts.total === 0) return 0;
  return Math.floor(((counts.known + counts.mastered) / counts.total) * 100);
}

export interface Accuracy {
  correct: number;
  total: number;
  /** 0–1; `null` khi chưa có lượt nào. */
  ratio: number | null;
}

const accuracy = (correct: number, total: number): Accuracy => ({
  correct,
  total,
  ratio: total === 0 ? null : correct / total,
});

/** Tỉ lệ đúng theo khóa bất kỳ (giữ thứ tự `keys`, khóa không có lượt → ratio null). */
export function accuracyBy<K extends string>(
  attempts: readonly { key: K; correct: boolean }[],
  keys: readonly K[],
): Record<K, Accuracy> {
  const tally = new Map<K, [number, number]>(keys.map((k) => [k, [0, 0]]));
  for (const { key, correct } of attempts) {
    const t = tally.get(key) ?? [0, 0];
    tally.set(key, [t[0] + (correct ? 1 : 0), t[1] + 1]);
  }
  return Object.fromEntries(
    [...tally].map(([k, [c, n]]) => [k, accuracy(c, n)] as const),
  ) as Record<K, Accuracy>;
}

/** P-03: tỉ lệ đúng theo ô quy tắc bảng 6.3 (`rule` của Tone Engine, vd. `low:dead-long`). */
export function ruleAccuracy(
  attempts: readonly { rule: string; correct: boolean }[],
  rules: readonly string[],
): Record<string, Accuracy> {
  return accuracyBy(
    attempts.map((a) => ({ key: a.rule, correct: a.correct })),
    rules,
  );
}

/** P-07: tỉ lệ đúng theo 5 thanh (theo thanh được hỏi). */
export function toneAccuracy(stats: readonly ListeningStatRecord[]): Record<Tone, Accuracy> {
  return accuracyBy(
    stats.map((s) => ({ key: s.expectedTone, correct: s.correct })),
    ToneSchema.options,
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * P-07: xu hướng 7 ngày — tỉ lệ đúng mỗi ngày (cũ → mới, ngày cuối là hôm nay).
 * Ngày tính theo múi giờ của `utcOffsetMinutes` (mặc định UTC; UI truyền offset của trình duyệt).
 */
export function dailyAccuracy(
  stats: readonly { ts: string; correct: boolean }[],
  now: Date,
  days = 7,
  utcOffsetMinutes = 0,
): { day: string; accuracy: Accuracy }[] {
  const offset = utcOffsetMinutes * 60_000;
  const dayKey = (ms: number) => new Date(ms + offset).toISOString().slice(0, 10);
  const keys = Array.from({ length: days }, (_, i) =>
    dayKey(now.getTime() - (days - 1 - i) * DAY_MS),
  );
  const byDay = accuracyBy(
    stats
      .map((s) => ({ key: dayKey(Date.parse(s.ts)), correct: s.correct }))
      .filter((a) => keys.includes(a.key)),
    keys,
  );
  return keys.map((day) => ({ day, accuracy: byDay[day]! }));
}
