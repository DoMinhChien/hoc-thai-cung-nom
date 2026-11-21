import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Bar {
  key: string;
  value: number;
  /** Nhãn trục (vd. "21/11") — chỉ hiện ở vài cột. */
  label: string;
  /** Nội dung tooltip đầy đủ. */
  tip: string;
  /** Cột nhấn (hôm nay). */
  strong?: boolean;
}

/**
 * Biểu đồ cột một chuỗi (SCR-09 §Quy tắc biểu đồ): chỉ màu accent, trục từ 0, ≤ 3 vạch lưới, không
 * chú giải; tooltip khi hover **và** focus bàn phím (`←` `→`); `role="img"` + tóm tắt bằng chữ.
 * Không thư viện (plan 7.1: "Recharts hoặc tương đương nhẹ").
 */
export function BarChart({
  bars,
  summary,
  height = 160,
  goal,
  goalLabel,
  labelEvery = 1,
  testId,
}: {
  bars: Bar[];
  summary: string;
  height?: number;
  goal?: number;
  goalLabel?: string;
  labelEvery?: number;
  testId?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, goal ?? 0, ...bars.map((b) => b.value));
  const top = niceMax(max);
  const ticks = [0, top / 2, top];
  const tip = active === null ? null : bars[active];
  return (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <div
        role="img"
        aria-label={summary}
        tabIndex={0}
        onFocus={() => setActive((a) => a ?? bars.length - 1)}
        onBlur={() => setActive(null)}
        onMouseLeave={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          setActive((a) =>
            Math.max(
              0,
              Math.min(bars.length - 1, (a ?? bars.length - 1) + (e.key === 'ArrowLeft' ? -1 : 1)),
            ),
          );
        }}
        className="relative flex gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          aria-hidden
          className="flex flex-col justify-between text-right text-xs text-muted-foreground tabular-nums"
          style={{ height }}
        >
          {[...ticks].reverse().map((v) => (
            <span key={v} className="-my-2 leading-4">
              {v}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((v) => (
            <span
              key={v}
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: `${(v / top) * 100}%` }}
            />
          ))}
          {goal !== undefined && goal > 0 && (
            <span
              aria-hidden
              className="absolute inset-x-0 border-t border-dashed border-subtle-foreground"
              style={{ bottom: `${(goal / top) * 100}%` }}
            >
              {goalLabel && (
                <span className="absolute right-0 -translate-y-full bg-surface px-1 text-xs text-muted-foreground">
                  {goalLabel}
                </span>
              )}
            </span>
          )}
          <div aria-hidden className="absolute inset-0 flex items-end gap-0.5">
            {bars.map((b, i) => (
              <div
                key={b.key}
                data-value={b.value}
                onMouseEnter={() => setActive(i)}
                className="flex h-full flex-1 items-end"
              >
                <div
                  className={cn(
                    'w-full rounded-t-[4px]',
                    b.strong ? 'bg-primary-hover' : 'bg-primary',
                    active === i && 'opacity-80',
                  )}
                  style={{ height: `${(b.value / top) * 100}%`, minHeight: b.value ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          {tip && (
            <div
              role="tooltip"
              data-testid={testId && `${testId}-tooltip`}
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md"
              style={{ left: `${((active! + 0.5) / bars.length) * 100}%` }}
            >
              {tip.tip}
            </div>
          )}
        </div>
      </div>
      <div aria-hidden className="flex gap-0.5 pl-8 text-xs text-muted-foreground">
        {bars.map((b, i) => (
          <span key={b.key} className="flex-1 overflow-visible text-center whitespace-nowrap">
            {i % labelEvery === labelEvery - 1 || i === 0 ? b.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Đỉnh trục y "tròn" (≥ giá trị lớn nhất), chia hết cho 2 để vạch giữa là số nguyên. */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) {
    const n = m * step;
    if (n >= v && n % 2 === 0) return n;
  }
  return Math.ceil(v / 2) * 2;
}
