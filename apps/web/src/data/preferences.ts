import { useRepositoryQuery } from './hooks';

/** Hiện phiên âm mặc định (G-01, plan 0.2: mặc định **ẩn**) — thẻ từ bài học, Sổ từ. */
export const SHOW_PHONETIC_KEY = 'showPhonetic';

/** Cài đặt "Hiện phiên âm mặc định"; `undefined` khi đang tải. */
export function useShowPhonetic(): boolean | undefined {
  return useRepositoryQuery((r) => r.settings.get(SHOW_PHONETIC_KEY, false), []);
}
