import {
  defaultSourceSpec,
  speakingPool,
  type LearnerSnapshot,
  type SourceSpec,
  type UnitBundle,
} from '@nom/core';
import { useMemo } from 'react';
import { useGameSource } from '@/pages/games/useGameSource';

/** Nội dung luyện nói đã chọn (riêng với Trò chơi). */
export const SPEAKING_SOURCE_KEY = 'speakingSource';

/** Mặc định "Bài vừa học" (SCR-10 §2); người mới → như Trò chơi. */
function speakingDefault(bundles: readonly UnitBundle[], learner: LearnerSnapshot): SourceSpec {
  return learner.lastLessonId ? { kind: 'last-lesson' } : defaultSourceSpec(bundles, learner);
}

/** Bộ chọn "Nội dung ôn" của M12.8 dùng cho Luyện nói + các mục nói được của nội dung. */
export function useSpeakingSource(override?: string | null) {
  const { state, choose } = useGameSource(override, SPEAKING_SOURCE_KEY, speakingDefault);
  const pool = useMemo(
    () => (state.status === 'ready' ? speakingPool(state.source, state.bundles) : []),
    [state],
  );
  return { state, choose, pool };
}
