import type { ReactNode } from 'react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

/** P-01: vòng tròn % hoàn thành của module. Số % luôn hiện ở giữa (D7: không giấu thông tin). */
export function ProgressRing({
  percent,
  label,
  size = 64,
  className,
  children,
}: {
  percent: number;
  /** Tên module/bộ — cho trình đọc màn hình. */
  label: string;
  size?: number;
  className?: string;
  /** Thay chữ % ở giữa (vd. số thứ tự chuyên đề) — % vẫn đọc qua `aria-label`. */
  children?: ReactNode;
}) {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  const stroke = Math.max(4, Math.round(size / 10));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={t('progress.ringLabel', { label, percent: value })}
      data-testid="progress-ring"
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums" aria-hidden="true">
        {children ?? t('progress.percent', { percent: value })}
      </span>
    </div>
  );
}
