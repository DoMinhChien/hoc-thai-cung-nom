import type { MasteryLevel } from '@nom/core';
import { cn } from '@/lib/utils';
import { MASTERY_PIPS } from './levels';

/** 0–3 chấm theo mức thuộc — ký hiệu đi kèm màu (người mù màu, plan 4.9). */
export function MasteryPips({ level, size = 'sm' }: { level: MasteryLevel; size?: 'xs' | 'sm' }) {
  const n = MASTERY_PIPS[level];
  if (n === 0) return null;
  return (
    <span aria-hidden="true" className="inline-flex gap-px" data-pips={n}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-full',
            size === 'xs' ? 'size-0.5' : 'size-1',
            level === 'mastered' ? 'bg-primary-foreground' : 'bg-foreground',
          )}
        />
      ))}
    </span>
  );
}
