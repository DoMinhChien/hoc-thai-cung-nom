import {
  completionPercent,
  countMastery,
  itemMastery,
  type CardRecord,
  type ItemType,
  type MasteryCounts,
  type MasteryLevel,
  type Repositories,
} from '@nom/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useContext } from 'react';
import { RepositoriesContext } from './repositories-context';

/** Repository của người dùng hiện tại; `null` khi đang xác định đăng nhập. */
export function useRepositories(): Repositories | null {
  return useContext(RepositoriesContext);
}

/**
 * Đọc dữ liệu qua repository, tự cập nhật khi IndexedDB đổi (Dexie `liveQuery`, plan 4.9).
 * `undefined` khi đang tải.
 */
export function useRepositoryQuery<T>(
  query: (repos: Repositories) => Promise<T>,
  deps: readonly unknown[],
): T | undefined {
  const repos = useRepositories();
  // deps do nơi gọi khai báo, như useLiveQuery.
  return useLiveQuery(() => (repos ? query(repos) : undefined), [repos, ...deps]);
}

/** Thẻ của một loại mục (vd. mọi phụ âm). */
export function useCards(itemType: ItemType): CardRecord[] | undefined {
  return useRepositoryQuery((r) => r.progress.listCards({ itemType }), [itemType]);
}

export interface MasterySummary {
  counts: MasteryCounts;
  percent: number;
  byItem: Map<string, MasteryLevel>;
}

/** Mức thuộc của một tập mục (module, deck…) — cho ProgressRing / StackedProgressBar / MasteryGrid. */
export function useMastery(
  itemType: ItemType,
  itemIds: readonly string[],
): MasterySummary | undefined {
  const cards = useCards(itemType);
  if (!cards) return undefined;
  const counts = countMastery(itemIds, cards);
  return { counts, percent: completionPercent(counts), byItem: itemMastery(itemIds, cards) };
}
