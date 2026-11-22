import type { AnyGameId } from '@nom/core';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Ô trắng nhỏ trong cảnh minh họa (thẻ, ô đáp án). Chữ Thái mẫu — trang trí, không phải nội dung. */
function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-md bg-surface px-1.5 text-xs font-semibold text-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </span>
  );
}

const E = ({ children, className }: { children: string; className?: string }) => (
  <span className={cn('nom-emoji', className)}>{children}</span>
);

/** Cảnh minh họa mỗi trò (SCR-08 v2 §A) — emoji Noto + khối CSS, nền màu trò, không đổi theo theme. */
const SCENES: Record<AnyGameId, ReactNode> = {
  match: (
    <span className="flex items-end gap-2">
      <Chip className="h-14 w-10 -rotate-12 bg-game-fg/90">?</Chip>
      <Chip className="h-14 w-10 font-thai text-base">แมว</Chip>
      <Chip className="h-14 w-10 rotate-12">
        <E className="text-2xl">🐱</E>
      </Chip>
    </span>
  ),
  'true-false': (
    <span className="flex flex-col items-center gap-2">
      <Chip className="h-9 px-4 font-thai text-base">หมา</Chip>
      <span className="flex gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-surface text-lg text-positive">
          ✓
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-surface text-lg text-destructive">
          ✕
        </span>
      </span>
    </span>
  ),
  'sentence-rush': (
    <span className="flex items-center gap-1">
      <Chip className="h-8 font-thai">ผม</Chip>
      <Chip className="h-8 font-thai">ชื่อ</Chip>
      <Chip className="h-8 font-thai">นิด</Chip>
      <E className="ml-1 text-2xl">⏱️</E>
    </span>
  ),
  'classifier-rush': (
    <span className="flex items-center gap-2">
      <E className="text-4xl">🐘</E>
      <Chip className="h-9 rounded-full px-3 font-thai text-base">ตัว</Chip>
    </span>
  ),
  'whack-a-mole': (
    <span className="flex items-end gap-3">
      <span className="h-3 w-10 rounded-full bg-game-fg/30" />
      <span className="flex flex-col items-center">
        <Chip className="mb-0.5 h-6 font-thai">ปลา</Chip>
        <E className="text-3xl">🐹</E>
        <span className="-mt-1 h-3 w-12 rounded-full bg-game-fg/30" />
      </span>
      <span className="h-3 w-10 rounded-full bg-game-fg/30" />
      <E className="text-2xl">🔨</E>
    </span>
  ),
  gameshow: (
    <span className="flex flex-col items-center gap-1.5">
      <E className="text-2xl">🎤</E>
      <span className="grid grid-cols-2 gap-1">
        {['A', 'B', 'C', 'D'].map((l) => (
          <Chip key={l} className="h-5 w-12">
            {l}
          </Chip>
        ))}
      </span>
    </span>
  ),
  airplane: (
    <span className="flex items-center gap-4">
      <E className="text-3xl">✈️</E>
      <span className="h-0 w-8 border-t-2 border-dotted border-game-fg/70" />
      <span className="flex flex-col gap-1">
        <Chip className="h-5 rounded-full font-thai">นก</Chip>
        <Chip className="h-5 rounded-full font-thai">แมว</Chip>
        <Chip className="h-5 rounded-full font-thai">ปลา</Chip>
      </span>
    </span>
  ),
  maze: (
    <span className="relative grid grid-cols-5 grid-rows-4 gap-0.5 rounded-md bg-game-fg/25 p-1">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'flex size-5 items-center justify-center rounded-sm',
            [1, 6, 8, 13, 17].includes(i) ? 'bg-game-fg/70' : 'bg-game/40',
          )}
        >
          {i === 0 && <E className="text-sm">👻</E>}
          {i === 12 && <E className="text-sm">🙂</E>}
          {i === 19 && <E className="text-sm">⭐</E>}
        </span>
      ))}
    </span>
  ),
};

/** Thumbnail 16:10 của trò (SCR-08 v2 §A). `data-game` đặt ở phần tử cha. */
export function Thumbnail({
  id,
  locked = false,
  className,
}: {
  id: AnyGameId;
  locked?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-testid={`game-thumb-${id}`}
      className={cn(
        'relative flex aspect-video tablet:aspect-[16/10] items-center justify-center overflow-hidden bg-game select-none',
        locked && 'grayscale-[0.6]',
        className,
      )}
    >
      {SCENES[id]}
      {locked && <span className="absolute inset-0 bg-surface/40" />}
    </span>
  );
}
