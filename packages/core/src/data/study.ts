/**
 * Thao tác học dùng chung cho mọi màn (M6+): đưa thẻ vào học, ghi một lượt ôn.
 * Chỉ dùng interface repository → chạy được trên Dexie lẫn bộ nhớ.
 */
import type { LessonStep } from '../content/bundle';
import { isLessonComplete, LESSON_PASS_SCORE } from '../progress/lessons';
import { reviewSrs, newSrsState, type SrsRating } from '../srs/srs';
import { newId } from './memory';
import type { CanDoRecord, CardRecord, CardType, ItemType, LessonProgressRecord } from './records';
import type { ProgressRepository, ReviewRepository } from './repositories';

/** Lấy thẻ của mục; chưa có thì tạo thẻ mới (tính vào thẻ mới hôm nay — B-03). */
export async function introduceCard(
  progress: ProgressRepository,
  item: { itemType: ItemType; itemId: string; cardType: CardType },
  now: Date,
): Promise<CardRecord> {
  const existing = await progress.findCard(item.itemType, item.itemId, item.cardType);
  if (existing) return existing;
  const ts = now.toISOString();
  const card: CardRecord = {
    id: newId(),
    ...item,
    fsrs: newSrsState(now),
    createdAt: ts,
    updatedAt: ts,
  };
  await progress.putCard(card);
  return card;
}

/** Ghi một lượt ôn: cập nhật lịch FSRS của thẻ + thêm log. */
export async function recordReview(
  repos: { progress: ProgressRepository; reviews: ReviewRepository },
  card: CardRecord,
  rating: SrsRating,
  now: Date,
  durationMs?: number,
): Promise<CardRecord> {
  const { state, log } = reviewSrs(card.fsrs, rating, now);
  const ts = now.toISOString();
  const updated: CardRecord = { ...card, fsrs: state, updatedAt: ts };
  await repos.progress.putCard(updated);
  await repos.reviews.addLog({
    ...log,
    id: newId(),
    cardId: card.id,
    ...(durationMs === undefined ? {} : { durationMs }),
    updatedAt: ts,
  });
  return updated;
}

/**
 * Ghi xong một bước của bài (plan 0.4). Bước Bài tập cần `score` (0–1): luôn giữ điểm cao nhất,
 * chỉ tính "xong" khi ≥ 80%. Lần đầu đủ mọi bước → `completedAt`.
 */
export async function completeLessonStep(
  progress: ProgressRepository,
  lesson: { lesson_id: string; unit_id: string; steps: readonly LessonStep[] },
  step: LessonStep,
  now: Date,
  score?: number,
): Promise<LessonProgressRecord> {
  const ts = now.toISOString();
  const current: LessonProgressRecord = (await progress.getLessonProgress(lesson.lesson_id)) ?? {
    id: newId(),
    lessonId: lesson.lesson_id,
    unitId: lesson.unit_id,
    stepsDone: [],
    bestScore: null,
    completedAt: null,
    updatedAt: ts,
  };
  if (step === 'exercise' && score === undefined) {
    throw new Error('completeLessonStep: bước Bài tập cần điểm (0–1)');
  }
  const bestScore =
    score === undefined ? current.bestScore : Math.max(current.bestScore ?? 0, score);
  const passed = step !== 'exercise' || (score ?? 0) >= LESSON_PASS_SCORE;
  const stepsDone =
    passed && !current.stepsDone.includes(step) ? [...current.stepsDone, step] : current.stepsDone;
  const record: LessonProgressRecord = {
    ...current,
    stepsDone,
    bestScore,
    completedAt: current.completedAt ?? (isLessonComplete(lesson.steps, { stepsDone }) ? ts : null),
    updatedAt: ts,
  };
  await progress.putLessonProgress(record);
  return record;
}

/** Người học tick / bỏ tick một mục can-do (P-11). */
export async function setCanDo(
  progress: ProgressRepository,
  unitId: string,
  canDo: string,
  checked: boolean,
  now: Date,
): Promise<CanDoRecord> {
  const existing = (await progress.listCanDo(unitId)).find((r) => r.canDo === canDo);
  const record: CanDoRecord = {
    id: existing?.id ?? newId(),
    unitId,
    canDo,
    checked,
    updatedAt: now.toISOString(),
  };
  await progress.putCanDo(record);
  return record;
}
