import type { MasteryCounts } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { LEVELS_DESC, MASTERY_BG } from './levels';
import { MasteryLegend } from './MasteryLegend';

/** P-04: thanh tiến độ xếp chồng 4 mức thuộc (đậm → nhạt), kèm chú giải có số. */
export function StackedProgressBar({
  counts,
  label,
  showLegend = true,
  className,
}: {
  counts: MasteryCounts;
  label: string;
  showLegend?: boolean;
  className?: string;
}) {
  const summary = t('progress.barLabel', { label, ...counts });
  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="stacked-progress">
      <div
        role="img"
        aria-label={summary}
        className="flex h-2.5 w-full overflow-hidden rounded-full border border-border bg-mastery-none"
      >
        {counts.total > 0 &&
          LEVELS_DESC.filter((level) => level !== 'none' && counts[level] > 0).map((level) => (
            <div
              key={level}
              data-level={level}
              className={cn('h-full', MASTERY_BG[level])}
              style={{ width: `${(counts[level] / counts.total) * 100}%` }}
            />
          ))}
      </div>
      {showLegend && <MasteryLegend counts={counts} />}
    </div>
  );
}
