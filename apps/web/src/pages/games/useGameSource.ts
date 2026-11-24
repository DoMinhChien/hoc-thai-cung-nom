import {
  countByScope,
  defaultSourceSpec,
  parseSourceKey,
  resolveGameSource,
  sourceKey,
  type GameSource,
  type LearnerSnapshot,
  type ScopeCount,
  type SourceSpec,
  type UnitBundle,
} from '@nom/core';
import { useCallback, useMemo } from 'react';
import { useAllUnits } from '@/content/hooks';
import { useRepositories, useRepositoryQuery } from '@/data';
import { GAME_SOURCE_KEY } from './catalog';

export type GameSourceState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      bundles: UnitBundle[];
      /** Nội dung đang dùng (URL > lựa chọn đã lưu > mặc định SCR-08 v3 §3). */
      spec: SourceSpec;
      source: GameSource;
      learner: LearnerSnapshot;
      /** Số từ / câu theo bài và bài học (bộ chọn nội dung). */
      counts: Map<string, ScopeCount>;
    };

/**
 * Nguồn câu hỏi của Trò chơi (SCR-08 v3): mọi unit + thẻ SRS + cờ "cần ôn" + bài vừa học + lựa
 * chọn đã lưu. `override` (`?source=` của màn chơi) thắng lựa chọn đã lưu. Giá trị cũ của setting
 * (`learned`, `unit:<id>`) đọc được qua `parseSourceKey`.
 */
export function useGameSource(
  override?: string | null,
  /** Luyện nói (SCR-10 §2) dùng lại bộ chọn với khóa cài đặt + mặc định riêng. */
  settingKey: string = GAME_SOURCE_KEY,
  fallback: (
    bundles: readonly UnitBundle[],
    learner: LearnerSnapshot,
  ) => SourceSpec = defaultSourceSpec,
): {
  state: GameSourceState;
  choose: (spec: SourceSpec) => Promise<void>;
} {
  const repos = useRepositories();
  const content = useAllUnits();
  const saved = useRepositoryQuery(
    (r) => r.settings.get<string | null>(settingKey, null),
    [settingKey],
  );
  const progress = useRepositoryQuery(async (r) => {
    const [cards, flags, lessons] = await Promise.all([
      r.progress.listCards(),
      r.progress.listNeedsReview(),
      r.progress.listLessonProgress(),
    ]);
    const last = lessons
      .filter((l) => l.completedAt)
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
    return {
      cards: cards.flatMap((c) =>
        c.itemType === 'word' || c.itemType === 'sentence'
          ? [{ itemType: c.itemType, itemId: c.itemId, createdAt: c.createdAt, due: c.fsrs.due }]
          : [],
      ),
      needsReview: flags.flatMap((f) =>
        f.itemType === 'word' || f.itemType === 'sentence'
          ? [{ itemType: f.itemType, itemId: f.itemId }]
          : [],
      ),
      lastLessonId: last?.lessonId ?? null,
    };
  }, []);

  const choose = useCallback(
    async (spec: SourceSpec) => {
      await repos?.settings.set(settingKey, sourceKey(spec));
    },
    [repos, settingKey],
  );

  const bundles = content.status === 'ready' ? content.data : undefined;
  const state = useMemo((): GameSourceState => {
    if (content.status === 'error') return { status: 'error' };
    if (!bundles || saved === undefined || !progress) return { status: 'loading' };
    const learner: LearnerSnapshot = { ...progress, now: new Date() };
    const spec = parseSourceKey(override) ?? parseSourceKey(saved) ?? fallback(bundles, learner);
    return {
      status: 'ready',
      bundles,
      spec,
      source: resolveGameSource(bundles, spec, learner),
      learner,
      counts: countByScope(bundles, learner),
    };
  }, [content.status, bundles, saved, progress, override, fallback]);

  return { state, choose };
}
