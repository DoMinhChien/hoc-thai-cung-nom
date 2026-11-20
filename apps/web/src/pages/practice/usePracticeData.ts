import {
  ACCURACY_WINDOW_DAYS,
  DEFAULT_PRACTICE_SESSION_SIZE,
  exercisePool,
  PRACTICE_FILTER_KEY,
  PRACTICE_SESSION_SIZE_KEY,
  type CardRecord,
  type ExerciseAttemptRecord,
  type ExercisePool,
  type LessonProgressRecord,
  type NeedsReviewRecord,
  type PracticeFilter,
  type SentenceLevelRecord,
  type UnitBundle,
} from '@nom/core';
import { useMemo } from 'react';
import { useAllUnits } from '@/content/hooks';
import { useRepositoryQuery } from '@/data';

const DAY_MS = 24 * 3600_000;

/** 0 giờ hôm nay theo giờ máy ("hôm nay" của mục tiêu ngày). */
export function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export interface PracticeData {
  bundles: UnitBundle[];
  pool: ExercisePool;
  cards: CardRecord[];
  levels: SentenceLevelRecord[];
  needsReview: NeedsReviewRecord[];
  /** Lượt trả lời 30 ngày qua. */
  attempts: ExerciseAttemptRecord[];
  lessons: LessonProgressRecord[];
  size: number;
  filter: PracticeFilter;
}

export type PracticeDataState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: PracticeData };

/** Content + tiến độ cho Bài tập (cập nhật trực tiếp khi dữ liệu đổi). */
export function usePracticeData(): PracticeDataState {
  const content = useAllUnits();
  const progress = useRepositoryQuery(async (r) => {
    const now = new Date();
    const [cards, levels, needsReview, attempts, lessons, size, filter] = await Promise.all([
      r.progress.listCards(),
      r.progress.listSentenceLevels(),
      r.progress.listNeedsReview(),
      r.reviews.attemptsBetween(new Date(now.getTime() - ACCURACY_WINDOW_DAYS * DAY_MS), now),
      r.progress.listLessonProgress(),
      r.settings.get(PRACTICE_SESSION_SIZE_KEY, DEFAULT_PRACTICE_SESSION_SIZE),
      r.settings.get<PracticeFilter>(PRACTICE_FILTER_KEY, 'all'),
    ]);
    return { cards, levels, needsReview, attempts, lessons, size, filter };
  }, []);
  const bundles = content.status === 'ready' ? content.data : undefined;
  const pool = useMemo(() => bundles && exercisePool(bundles), [bundles]);

  if (content.status === 'error') return { status: 'error' };
  if (!bundles || !pool || !progress) return { status: 'loading' };
  return { status: 'ready', data: { bundles, pool, ...progress } };
}
