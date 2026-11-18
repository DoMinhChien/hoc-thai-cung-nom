import {
  LEARNED_SOURCE,
  learnedSource,
  selectGameSource,
  type GameItemRef,
  type GameSource,
  type UnitBundle,
} from '@nom/core';
import { useCallback } from 'react';
import { useAllUnits } from '@/content/hooks';
import { useRepositories, useRepositoryQuery } from '@/data';
import { GAME_SOURCE_KEY } from './catalog';

export type GameSourceState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      bundles: UnitBundle[];
      /** Lựa chọn đã lưu (`learned` hoặc `unit:<id>`). */
      choice: string;
      /** Nguồn thực dùng — "Từ đã học" chưa đủ thì là chuyên đề đầu tiên (F-10 v7.2). */
      source: GameSource;
      fallback: boolean;
      /** Số từ / câu đã học (cho dòng "Từ đã học (n từ · m câu)"). */
      learned: { words: number; sentences: number };
    };

/**
 * Nguồn câu hỏi của Trò chơi: mọi unit + mục đã có thẻ SRS + lựa chọn đã lưu.
 * `override` (vd. `?source=` trên URL màn chơi) thắng lựa chọn đã lưu.
 */
export function useGameSource(override?: string | null): {
  state: GameSourceState;
  choose: (choice: string) => Promise<void>;
} {
  const repos = useRepositories();
  const content = useAllUnits();
  const saved = useRepositoryQuery((r) => r.settings.get(GAME_SOURCE_KEY, LEARNED_SOURCE), []);
  const learnedRefs = useRepositoryQuery(
    async (r): Promise<GameItemRef[]> =>
      (await r.progress.listCards()).flatMap((c) =>
        c.itemType === 'word' || c.itemType === 'sentence'
          ? [{ itemType: c.itemType, itemId: c.itemId }]
          : [],
      ),
    [],
  );

  const choose = useCallback(
    async (choice: string) => {
      await repos?.settings.set(GAME_SOURCE_KEY, choice);
    },
    [repos],
  );

  if (content.status === 'error') return { state: { status: 'error' }, choose };
  if (content.status === 'loading' || saved === undefined || learnedRefs === undefined) {
    return { state: { status: 'loading' }, choose };
  }
  const choice = override ?? saved;
  const { source, fallback } = selectGameSource(content.data, learnedRefs, choice);
  const learned = learnedSource(content.data, learnedRefs);
  return {
    state: {
      status: 'ready',
      bundles: content.data,
      choice,
      source,
      fallback,
      learned: { words: learned.words.length, sentences: learned.sentences.length },
    },
    choose,
  };
}
