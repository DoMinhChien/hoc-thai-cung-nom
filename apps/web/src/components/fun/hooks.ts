import {
  studyStreak,
  topicColors,
  type StudyStreak,
  type TopicColor,
  type UnitSummary,
} from '@nom/core';
import { useMemo } from 'react';
import { useUnits } from '@/content/hooks';
import { useRepositoryQuery } from '@/data';

/** Màu chuyên đề theo vị trí trong lộ trình đầy đủ (M0.5c Q1) — dùng cho `data-topic`. */
export function useTopicColors(units: readonly UnitSummary[] | undefined) {
  return useMemo(() => topicColors(units ?? []), [units]);
}

/** Màu chuyên đề của một unit (cần danh sách lộ trình — đã cache bởi content client). */
export function useUnitTopic(unitId: string): TopicColor | undefined {
  const units = useUnits();
  const colors = useTopicColors(units.status === 'ready' ? units.data : undefined);
  return colors.get(unitId);
}

/** Xem lại tối đa chừng này ngày khi tính chuỗi (đủ cho mốc 100 ngày + dư). */
const LOOKBACK_DAYS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Chuỗi ngày học (M0.5c §2.4, Q4): mọi hoạt động có chấm điểm — bài tập, ôn thẻ, bước bài học,
 * lượt trò chơi (phiên `game`, kỷ lục). `undefined` khi đang tải.
 */
export function useStudyStreak(now?: Date): StudyStreak | undefined {
  const at = now?.getTime();
  return useRepositoryQuery(
    async (r) => {
      const to = at === undefined ? new Date() : new Date(at);
      const from = new Date(to.getTime() - LOOKBACK_DAYS * DAY_MS);
      const end = new Date(to.getTime() + 1);
      const [attempts, logs, sessions, lessons, games] = await Promise.all([
        r.reviews.attemptsBetween(from, end),
        r.reviews.logsBetween(from, end),
        r.sessions.listBetween(from, end),
        r.progress.listLessonProgress(),
        r.progress.listGameResults(),
      ]);
      return studyStreak(
        [
          ...attempts.map((a) => a.ts),
          ...logs.map((l) => l.review),
          ...sessions.map((s) => s.startedAt),
          ...lessons.filter((l) => l.stepsDone.length > 0).map((l) => l.updatedAt),
          ...games.map((g) => g.lastPlayedAt),
        ],
        to,
        -to.getTimezoneOffset(),
      );
    },
    [at],
  );
}
