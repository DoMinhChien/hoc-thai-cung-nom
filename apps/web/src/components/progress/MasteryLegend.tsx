import type { MasteryCounts } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { LEVELS_DESC, MASTERY_BG } from './levels';
import { MasteryPips } from './MasteryPips';

/** Chú giải 4 mức thuộc: ô màu + chấm + tên (+ số nếu có `counts`). */
export function MasteryLegend({
  counts,
  className,
}: {
  counts?: MasteryCounts;
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      {LEVELS_DESC.map((level) => (
        <li key={level} className="flex items-center gap-1.5" data-testid={`legend-${level}`}>
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex size-3.5 items-center justify-center rounded-sm border border-border',
              MASTERY_BG[level],
            )}
          >
            <MasteryPips level={level} size="xs" />
          </span>
          <span>{t(`progress.level.${level}`)}</span>
          {counts && (
            <span className="font-medium tabular-nums text-foreground">{counts[level]}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
