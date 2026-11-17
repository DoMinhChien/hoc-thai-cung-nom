/**
 * Selector tiến độ bài học / unit (plan 0.4, 0.8: P-04 theo unit, P-10 `UnitPath`, P-11 `CanDoList`).
 * Thuần: input content đã build + bản ghi repository → trạng thái cho UI.
 */
import type { LessonStep } from '../content/bundle';
import type { CanDoRecord, LessonProgressRecord } from '../data/records';

/** Bài tập đạt ≥ 80% → bài hoàn thành (plan 0.4 bước 4). */
export const LESSON_PASS_SCORE = 0.8;

export type StudyStatus = 'not-started' | 'in-progress' | 'completed';

type LessonRef = { lesson_id: string; steps: readonly LessonStep[] };

/**
 * Bài hoàn thành khi mọi bước của bài đã xong. Bước Bài tập chỉ được ghi "xong" khi đạt
 * `LESSON_PASS_SCORE` (xem `completeLessonStep`), nên bài có Bài tập cần ≥ 80%.
 * Bài không có bước nào (unit mới có content draft) không bao giờ hoàn thành.
 */
export function isLessonComplete(
  steps: readonly LessonStep[],
  record: Pick<LessonProgressRecord, 'stepsDone'> | undefined,
): boolean {
  if (!record || steps.length === 0) return false;
  return steps.every((step) => record.stepsDone.includes(step));
}

export function lessonStatus(
  lesson: LessonRef,
  record: LessonProgressRecord | undefined,
): StudyStatus {
  if (record?.completedAt || isLessonComplete(lesson.steps, record)) return 'completed';
  return record && (record.stepsDone.length > 0 || record.bestScore !== null)
    ? 'in-progress'
    : 'not-started';
}

const byLesson = (records: readonly LessonProgressRecord[]) =>
  new Map(records.map((r) => [r.lessonId, r]));

/** Số bài đã hoàn thành / tổng và % (làm tròn xuống) — P-04 theo unit, `ProgressRing`. */
export function unitLessonProgress(
  lessons: readonly LessonRef[],
  records: readonly LessonProgressRecord[],
): { completed: number; total: number; percent: number } {
  const map = byLesson(records);
  const completed = lessons.filter(
    (l) => lessonStatus(l, map.get(l.lesson_id)) === 'completed',
  ).length;
  const total = lessons.length;
  return { completed, total, percent: total === 0 ? 0 : Math.floor((completed / total) * 100) };
}

/** Trạng thái unit cho `UnitPath` (P-10): xong khi mọi bài xong; đang học khi đã bắt đầu bài nào. */
export function unitStatus(
  lessons: readonly LessonRef[],
  records: readonly LessonProgressRecord[],
): StudyStatus {
  const map = byLesson(records);
  const statuses = lessons.map((l) => lessonStatus(l, map.get(l.lesson_id)));
  if (statuses.length > 0 && statuses.every((s) => s === 'completed')) return 'completed';
  return statuses.some((s) => s !== 'not-started') ? 'in-progress' : 'not-started';
}

export interface CanDoItem {
  canDo: string;
  checked: boolean;
  /** Tick tự động vì đã xong mọi bài của unit (người học không bỏ tick được). */
  auto: boolean;
}

/** Checklist can-do (P-11): tự tick khi unit xong; ngoài ra theo tick tay của người học. */
export function canDoChecklist(
  unit: { can_do: readonly string[]; lessons: readonly LessonRef[] },
  lessonRecords: readonly LessonProgressRecord[],
  canDoRecords: readonly CanDoRecord[],
): CanDoItem[] {
  const auto = unitStatus(unit.lessons, lessonRecords) === 'completed';
  const manual = new Map(canDoRecords.map((r) => [r.canDo, r.checked]));
  return unit.can_do.map((canDo) => ({
    canDo,
    checked: auto || manual.get(canDo) === true,
    auto,
  }));
}
