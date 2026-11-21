import { Star } from 'lucide-react';
import type { CSSProperties } from 'react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Hiệu ứng hoàn thành (M0.5c §2.3): chấm tỏa ra quanh phần tử cha (`relative`); `record` = 12 chấm
 * xen `highlight` (`fb-record`). Chỉ trang trí, reduced-motion → ẩn.
 */
export function Burst({ record = false, className }: { record?: boolean; className?: string }) {
  const dots = record ? 12 : 8;
  return (
    <span
      aria-hidden
      data-testid="fx-burst"
      className={cn('pointer-events-none absolute inset-0 hidden motion-safe:block', className)}
    >
      {Array.from({ length: dots }, (_, i) => (
        <span
          key={i}
          className={cn(
            'absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 rounded-full motion-safe:animate-fb-burst',
            record && i % 2 === 1 ? 'bg-highlight' : 'bg-current',
          )}
          style={
            {
              '--burst-angle': `${(360 / dots) * i}deg`,
              '--burst-distance': record ? '-72px' : '-56px',
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/**
 * Sao kết quả 1–3 (plan 0.14, M0.5c §2.5): tô `star-fill`, viền `star-stroke`; sao trống chỉ viền.
 * Bật lần lượt 150 ms/sao; luôn kèm chữ "n/3 sao".
 */
export function Stars({ n, size = 'lg' }: { n: number; size?: 'md' | 'lg' }) {
  return (
    <p
      data-testid="result-stars"
      data-stars={n}
      role="img"
      aria-label={t('games.stars', { n })}
      className="flex items-center gap-2"
    >
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={1.75}
          style={{ animationDelay: `${(i - 1) * 150}ms` }}
          className={cn(
            size === 'lg' ? 'size-14' : 'size-9',
            i <= n
              ? 'fill-star-fill text-star-stroke motion-safe:animate-star'
              : 'text-border-strong',
          )}
        />
      ))}
      <span aria-hidden className="ml-2 text-sm font-medium text-muted-foreground">
        {t('games.stars', { n })}
      </span>
    </p>
  );
}
