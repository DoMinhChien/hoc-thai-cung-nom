import type { ReactNode } from 'react';
import type { GameTheme } from '@/components/interactive';
import { Emoji } from '@/components/fun';

/** Đồ trang trí ở mép cảnh (SCR-08 v2 §Theme) — không đặt sau vùng chữ. */
const DECOR: Record<GameTheme, [string, string, string]> = {
  sea: ['⛵', '🐚', '🌴'],
  space: ['🪐', '⭐', '🌙'],
  garden: ['🌳', '🌼', '🦋'],
};

/**
 * Cảnh nền màn chơi theo theme: 2 dải màu phẳng (`scene-top` → `scene-bottom`) nối bằng một đường
 * cong SVG + vài đồ trang trí ở mép. Nằm sau nội dung (`fixed`, `-z-10`), chỉ trang trí.
 */
export function GameScene({ theme }: { theme: GameTheme }) {
  const [a, b, c] = DECOR[theme];
  return (
    <div aria-hidden data-testid="game-scene" className="fixed inset-0 -z-10 bg-scene-top">
      <svg
        className="absolute inset-x-0 bottom-0 h-[38%] w-full text-scene-bottom"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <path fill="currentColor" d="M0 60 C 360 0, 1080 120, 1440 40 L 1440 400 L 0 400 Z" />
      </svg>
      <span className="absolute top-6 left-6 opacity-80 max-tablet:hidden">
        <Emoji size="md">{a}</Emoji>
      </span>
      <span className="absolute right-8 bottom-6 opacity-80 max-tablet:hidden">
        <Emoji size="md">{b}</Emoji>
      </span>
      <span className="absolute bottom-10 left-10 opacity-80 max-tablet:hidden">
        <Emoji size="lg">{c}</Emoji>
      </span>
    </div>
  );
}

/** Khung màn chơi: theme (`data-game-theme`) + cảnh nền + nội dung. */
export function GameStage({ theme, children }: { theme: GameTheme; children: ReactNode }) {
  return (
    <div data-game-theme={theme} className="relative">
      <GameScene theme={theme} />
      {children}
    </div>
  );
}
