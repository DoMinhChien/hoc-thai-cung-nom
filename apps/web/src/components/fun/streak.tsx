import type { StudyStreak } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useStudyStreak } from './hooks';
import { Emoji } from './topic';

/**
 * Chip chuỗi ngày học ở sidebar (hướng B): "🔥 5 ngày"; hôm nay chưa học → icon xám + nhắc.
 * `compact` (thanh trên phone, rail tablet — SCR-00 v2): "🔥 5", chữ đầy đủ cho trình đọc màn hình.
 */
export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const streak = useStudyStreak();
  if (!streak || streak.count === 0) return null;
  const days = t('streak.days', { n: streak.count });
  return (
    <p
      data-testid="streak-badge"
      data-today={streak.today}
      title={streak.today ? (compact ? days : undefined) : t('streak.keep')}
      className={cn(
        'flex items-center self-start rounded-full bg-surface font-semibold shadow-card',
        compact ? 'gap-1 px-2 py-0.5 text-sm' : 'gap-2 px-3 py-1 text-sm',
      )}
    >
      <Emoji size="sm" className={cn('text-base', !streak.today && 'opacity-40 grayscale')}>
        🔥
      </Emoji>
      {compact ? (
        <span className={streak.today ? 'text-streak' : 'text-muted-foreground'}>
          <span aria-hidden className="tabular-nums">
            {streak.count}
          </span>
          <span className="sr-only">{days}</span>
        </span>
      ) : (
        <span className={streak.today ? 'text-streak' : 'text-muted-foreground'}>{days}</span>
      )}
    </p>
  );
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

/** Khối chuỗi ngày học (hướng B): 🔥 + số lớn + 7 chấm của tuần (đầu trang Bài tập, Tổng quan). */
export function StreakCard({
  streak,
  stacked = false,
  className,
}: {
  streak: StudyStreak;
  /** Cột hẹp (Tổng quan): 7 chấm tuần xuống hàng riêng. */
  stacked?: boolean;
  className?: string;
}) {
  return (
    <section
      data-testid="streak-card"
      data-count={streak.count}
      aria-label={t('streak.label')}
      className={cn(
        'flex items-center gap-4 rounded-xl border bg-surface px-5 py-4 shadow-card',
        stacked && 'flex-wrap',
        className,
      )}
    >
      <Emoji
        size="md"
        className={cn(
          !streak.today && 'opacity-40 grayscale',
          streak.milestone && 'motion-safe:animate-fb-streak',
        )}
      >
        🔥
      </Emoji>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex items-baseline gap-2">
          <span
            key={streak.count}
            className={cn(
              'text-[28px] leading-none font-bold tabular-nums motion-safe:animate-fb-streak',
              streak.today ? 'text-streak' : 'text-muted-foreground',
            )}
          >
            {streak.count}
          </span>
          <span className="text-sm text-muted-foreground">{t('streak.unit')}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {streak.today ? t('streak.done') : t('streak.keep')}
        </p>
      </div>
      <ol
        className={cn('flex gap-2', stacked ? 'w-full justify-between' : 'ml-auto')}
        aria-label={t('streak.week')}
      >
        {streak.week.map((d, i) => (
          <li key={d.day} className="flex flex-col items-center gap-1">
            <span
              aria-hidden
              className={cn(
                'size-4 rounded-full border-2',
                d.studied ? 'border-streak bg-streak' : 'border-border-strong',
                d.isToday && 'ring-2 ring-streak ring-offset-2 ring-offset-surface',
              )}
            />
            <span className="text-xs text-muted-foreground">
              {WEEKDAYS[i]}
              <span className="sr-only">
                {d.studied ? t('streak.studied') : t('streak.notStudied')}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
