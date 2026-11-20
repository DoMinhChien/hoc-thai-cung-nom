import { useCallback } from 'react';
import { useRepositories, useRepositoryQuery } from '@/data';

/** Chủ đề màn chơi arcade (M9.6 T9.6.3, plan 0.14) — `data-game-theme` trên khung màn chơi. */
export const GAME_THEMES = ['sea', 'space', 'garden'] as const;
export type GameTheme = (typeof GAME_THEMES)[number];
export const GAME_THEME_KEY = 'gameTheme';
export const DEFAULT_GAME_THEME: GameTheme = 'sea';

const isTheme = (value: unknown): value is GameTheme =>
  (GAME_THEMES as readonly unknown[]).includes(value);

export interface GameThemeSetting {
  /** `undefined` khi đang tải cài đặt. */
  theme: GameTheme | undefined;
  setTheme(theme: GameTheme): Promise<void>;
}

/** Chủ đề đã chọn, nhớ theo người dùng; giá trị lạ (bản cũ, sửa tay) → mặc định. */
export function useGameTheme(): GameThemeSetting {
  const repos = useRepositories();
  const stored = useRepositoryQuery(
    (r) => r.settings.get<unknown>(GAME_THEME_KEY, DEFAULT_GAME_THEME),
    [],
  );
  const setTheme = useCallback(
    async (theme: GameTheme) => {
      await repos?.settings.set(GAME_THEME_KEY, theme);
    },
    [repos],
  );
  const theme = stored === undefined ? undefined : isTheme(stored) ? stored : DEFAULT_GAME_THEME;
  return { theme, setTheme };
}
