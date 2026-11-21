/**
 * Selector báo cáo Tiến độ / Tổng quan (M10, SCR-03, SCR-09). Hàm thuần: input = bản ghi + `now`
 * (+ `utcOffsetMinutes` cho ngày địa phương), không phụ thuộc React/Dexie.
 */
import type {
  CardRecord,
  ExerciseAttemptRecord,
  GameResultRecord,
  ReviewLogRecord,
  SessionRecord,
} from '../data/records';
import type { ExerciseType } from '../exercises/exercises';
import { ALL_GAME_IDS, type AnyGameId } from '../games/catalog';
import { isBetterResult, type GameStats } from '../games/game';
import { dayKey } from './streak';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dưới chừng này lượt → "Chưa đủ dữ liệu" (SCR-09 §C, §D). */
export const MIN_REPORT_SAMPLES = 10;

/** Khóa ngày của `days` ngày gần nhất (cũ → mới, cuối là hôm nay). */
export function lastDays(now: Date, days: number, utcOffsetMinutes = 0): string[] {
  return Array.from({ length: days }, (_, i) =>
    dayKey(now.getTime() - (days - 1 - i) * DAY_MS, utcOffsetMinutes),
  );
}

export interface DayActivity {
  day: string;
  /** Lượt bài tập + lượt ôn thẻ + từ/câu mới vào học (SCR-09 §B). */
  count: number;
  /** Lượt bài tập đã chấm (lần trả lời đầu) — so với mục tiêu ngày. */
  practiced: number;
}

/** Hoạt động mỗi ngày trong `days` ngày gần nhất (SCR-09 §B). */
export function activityByDay(
  input: {
    attempts: readonly Pick<ExerciseAttemptRecord, 'ts' | 'rating'>[];
    logs: readonly Pick<ReviewLogRecord, 'review'>[];
    cards: readonly Pick<CardRecord, 'createdAt'>[];
  },
  now: Date,
  days = 30,
  utcOffsetMinutes = 0,
): DayActivity[] {
  const keys = lastDays(now, days, utcOffsetMinutes);
  const by = new Map(keys.map((day) => [day, { day, count: 0, practiced: 0 }]));
  const hit = (ts: string, practiced = false) => {
    const d = by.get(dayKey(Date.parse(ts), utcOffsetMinutes));
    if (!d) return;
    d.count++;
    if (practiced) d.practiced++;
  };
  for (const a of input.attempts) hit(a.ts, a.rating !== null);
  for (const l of input.logs) hit(l.review);
  for (const c of input.cards) hit(c.createdAt);
  return keys.map((k) => by.get(k)!);
}

/** Một phiên dài hơn chừng này (quên tắt tab…) chỉ tính tới đây (SCR-09 Q2). */
export const MAX_SESSION_MS = 60 * 60 * 1000;
/** Ước tính mỗi lượt trả lời không thuộc phiên nào (dữ liệu trước M10). */
export const ESTIMATED_MS_PER_ANSWER = 15_000;

/**
 * Thời gian học (SCR-09 Q2 = a + b): tổng phiên đã kết thúc (mỗi phiên ≤ 60 phút) + ước tính 15 s
 * cho mỗi lượt bài tập / ôn thẻ xảy ra trước phiên đầu tiên.
 */
export function studyTime(input: {
  sessions: readonly Pick<SessionRecord, 'startedAt' | 'endedAt'>[];
  attempts: readonly Pick<ExerciseAttemptRecord, 'ts'>[];
  logs: readonly Pick<ReviewLogRecord, 'review'>[];
}): number {
  let ms = 0;
  let first = Infinity;
  for (const s of input.sessions) {
    const start = Date.parse(s.startedAt);
    first = Math.min(first, start);
    if (!s.endedAt) continue;
    ms += Math.min(MAX_SESSION_MS, Math.max(0, Date.parse(s.endedAt) - start));
  }
  const before = (ts: string) => Date.parse(ts) < first;
  const old =
    input.attempts.filter((a) => before(a.ts)).length +
    input.logs.filter((l) => before(l.review)).length;
  return ms + old * ESTIMATED_MS_PER_ANSWER;
}

/**
 * Tỉ lệ nhớ đúng (R-05): lượt ôn thẻ đang ở trạng thái `review` không chọn "Quên" / tổng lượt đó,
 * trong `days` ngày. `null` khi < `MIN_REPORT_SAMPLES` lượt.
 */
export function retention(
  logs: readonly Pick<ReviewLogRecord, 'review' | 'state' | 'rating'>[],
  now: Date,
  days: number,
): number | null {
  const from = now.getTime() - days * DAY_MS;
  const inRange = logs.filter((l) => {
    const t = Date.parse(l.review);
    return l.state === 'review' && t >= from && t <= now.getTime();
  });
  if (inRange.length < MIN_REPORT_SAMPLES) return null;
  return inRange.filter((l) => l.rating !== 'again').length / inRange.length;
}

/** Dự báo đến hạn (P-04): 7 ngày tới (hôm nay gồm cả quá hạn) + tổng 30 ngày. */
export function dueForecast(
  cards: readonly Pick<CardRecord, 'fsrs'>[],
  now: Date,
  utcOffsetMinutes = 0,
): { days: { day: string; count: number }[]; next30: number } {
  const days = Array.from({ length: 7 }, (_, i) => ({
    day: dayKey(now.getTime() + i * DAY_MS, utcOffsetMinutes),
    count: 0,
  }));
  const index = new Map(days.map((d, i) => [d.day, i]));
  const end30 = now.getTime() + 30 * DAY_MS;
  let next30 = 0;
  for (const c of cards) {
    if (c.fsrs.state === 'new') continue;
    const t = Date.parse(c.fsrs.due);
    if (t <= end30) next30++;
    const i = t <= now.getTime() ? 0 : index.get(dayKey(t, utcOffsetMinutes));
    if (i !== undefined) days[i]!.count++;
  }
  return { days, next30 };
}

/** Nhóm kỹ năng P-12 (SCR-09 Q1 = a) — thanh Từ vựng tính theo mức thuộc, không theo lượt. */
export const SKILL_GROUPS = {
  'th-vi': ['E-01', 'E-04', 'E-05', 'E-09'],
  'vi-th': ['E-02', 'E-06', 'E-07', 'E-14'],
  listening: ['E-08'],
} as const satisfies Record<string, readonly ExerciseType[]>;
export type SkillGroup = keyof typeof SKILL_GROUPS;

export interface SkillAccuracy {
  correct: number;
  total: number;
  /** `null` khi < `MIN_REPORT_SAMPLES` lượt. */
  ratio: number | null;
}

const accuracy = (correct: number, total: number): SkillAccuracy => ({
  correct,
  total,
  ratio: total >= MIN_REPORT_SAMPLES ? correct / total : null,
});

/** Tỉ lệ đúng lần trả lời đầu (`rating ≠ null`) trong `days` ngày theo nhóm kỹ năng. */
export function skillAccuracy(
  attempts: readonly Pick<ExerciseAttemptRecord, 'ts' | 'rating' | 'correct' | 'exerciseType'>[],
  now: Date,
  days = 30,
): Record<SkillGroup, SkillAccuracy> {
  const from = now.getTime() - days * DAY_MS;
  const first = attempts.filter((a) => a.rating !== null && Date.parse(a.ts) >= from);
  const of = (types: readonly string[]) => {
    const list = first.filter((a) => types.includes(a.exerciseType));
    return accuracy(list.filter((a) => a.correct).length, list.length);
  };
  return {
    'th-vi': of(SKILL_GROUPS['th-vi']),
    'vi-th': of(SKILL_GROUPS['vi-th']),
    listening: of(SKILL_GROUPS.listening),
  };
}

/** Tỉ lệ đúng theo loại bài (R-04', SCR-09 §F) — loại có lượt, % tăng dần, tối đa 10. */
export function accuracyByExerciseType(
  attempts: readonly Pick<ExerciseAttemptRecord, 'ts' | 'rating' | 'correct' | 'exerciseType'>[],
  now: Date,
  days = 30,
): { type: ExerciseType; correct: number; total: number; ratio: number }[] {
  const from = now.getTime() - days * DAY_MS;
  const by = new Map<ExerciseType, { correct: number; total: number }>();
  for (const a of attempts) {
    if (a.rating === null || Date.parse(a.ts) < from) continue;
    const s = by.get(a.exerciseType) ?? { correct: 0, total: 0 };
    s.total++;
    if (a.correct) s.correct++;
    by.set(a.exerciseType, s);
  }
  return [...by]
    .map(([type, s]) => ({ type, ...s, ratio: s.correct / s.total }))
    .sort((a, b) => a.ratio - b.ratio || a.type.localeCompare(b.type))
    .slice(0, 10);
}

/**
 * Mẫu câu hay sai (R-04', SCR-09 §F): lần trả lời đầu của bài câu trong `days` ngày, nhóm theo
 * `grammar_id` của câu; ≥ `minTotal` lượt và có sai; nhiều lần sai trước; tối đa `limit`.
 */
export function grammarMistakes(
  attempts: readonly Pick<
    ExerciseAttemptRecord,
    'ts' | 'rating' | 'correct' | 'itemType' | 'itemId'
  >[],
  grammarOf: ReadonlyMap<string, string>,
  now: Date,
  { days = 30, minTotal = 3, limit = 5 } = {},
): { grammarId: string; wrong: number; total: number }[] {
  const from = now.getTime() - days * DAY_MS;
  const by = new Map<string, { wrong: number; total: number }>();
  for (const a of attempts) {
    if (a.rating === null || a.itemType !== 'sentence' || Date.parse(a.ts) < from) continue;
    const g = grammarOf.get(a.itemId);
    if (!g) continue;
    const s = by.get(g) ?? { wrong: 0, total: 0 };
    s.total++;
    if (!a.correct) s.wrong++;
    by.set(g, s);
  }
  return [...by]
    .map(([grammarId, s]) => ({ grammarId, ...s }))
    .filter((g) => g.total >= minTotal && g.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total)
    .slice(0, limit);
}

/** Từ & câu khó (R-06, SCR-09 §G): mục có ≥ `min` lần "Quên" trong toàn lịch sử. */
export function hardItems(
  logs: readonly Pick<ReviewLogRecord, 'cardId' | 'rating'>[],
  cards: readonly Pick<CardRecord, 'id' | 'itemType' | 'itemId'>[],
  { min = 2, limit = 10 } = {},
): { itemType: CardRecord['itemType']; itemId: string; lapses: number }[] {
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const by = new Map<
    string,
    { itemType: CardRecord['itemType']; itemId: string; lapses: number }
  >();
  for (const l of logs) {
    if (l.rating !== 'again') continue;
    const c = cardById.get(l.cardId);
    if (!c) continue;
    const key = `${c.itemType}:${c.itemId}`;
    const s = by.get(key) ?? { itemType: c.itemType, itemId: c.itemId, lapses: 0 };
    s.lapses++;
    by.set(key, s);
  }
  return [...by.values()]
    .filter((s) => s.lapses >= min)
    .sort((a, b) => b.lapses - a.lapses || a.itemId.localeCompare(b.itemId))
    .slice(0, limit);
}

export interface GameReport {
  gameId: AnyGameId;
  best: GameStats;
  plays: number;
}

/** Trò chơi (P-09, SCR-09 §H): gộp mọi nguồn — kỷ lục tốt nhất, cộng số lượt; thứ tự `ALL_GAME_IDS`. */
export function gameReport(records: readonly GameResultRecord[]): {
  played: GameReport[];
  unplayed: AnyGameId[];
} {
  const by = new Map<AnyGameId, GameReport>();
  for (const r of records) {
    const cur = by.get(r.gameId);
    if (!cur) by.set(r.gameId, { gameId: r.gameId, best: r.best, plays: r.plays });
    else {
      cur.plays += r.plays;
      if (isBetterResult(r.gameId, r.best, cur.best)) cur.best = r.best;
    }
  }
  return {
    played: ALL_GAME_IDS.flatMap((id) => (by.has(id) ? [by.get(id)!] : [])),
    unplayed: ALL_GAME_IDS.filter((id) => !by.has(id)),
  };
}
