import type { Accuracy, Tone } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { TONE_BG, TONE_GLYPH, TONES } from './levels';

const valueText = (a: Accuracy) =>
  a.ratio === null
    ? t('progress.noData')
    : t('progress.percent', { percent: Math.round(a.ratio * 100) });

/**
 * P-07: biểu đồ cột tỉ lệ đúng theo 5 thanh (màu theo thanh). Mỗi cột có tên + ký hiệu thanh
 * và số % (D10) — trình đọc màn hình đọc danh sách thay cho hình.
 */
export function ToneBarChart({
  data,
  height = 160,
  className,
}: {
  data: Record<Tone, Accuracy>;
  height?: number;
  className?: string;
}) {
  return (
    <figure className={cn('flex flex-col gap-2', className)} data-testid="tone-bar-chart">
      <figcaption className="text-sm text-muted-foreground">
        {t('progress.toneChartLabel')}
      </figcaption>
      <ul className="flex items-end gap-4" style={{ height: height + 48 }}>
        {TONES.map((tone) => {
          const a = data[tone];
          const pct = a.ratio === null ? 0 : a.ratio * 100;
          return (
            <li
              key={tone}
              className="flex flex-1 flex-col items-center gap-1"
              data-testid={`tone-bar-${tone}`}
            >
              <span className="sr-only">
                {t('progress.toneBar', { tone: t(`progress.tone.${tone}`), value: valueText(a) })}
              </span>
              <span className="text-xs font-semibold tabular-nums" aria-hidden="true">
                {valueText(a)}
              </span>
              <div
                className="flex w-full max-w-12 items-end rounded-t-sm bg-muted"
                style={{ height }}
                aria-hidden="true"
              >
                <div
                  className={cn('w-full rounded-t-sm', TONE_BG[tone])}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="flex items-center gap-1 text-xs" aria-hidden="true">
                <span className="text-sm leading-none">{TONE_GLYPH[tone]}</span>
                {t(`progress.tone.${tone}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
