import type { StudyStreak } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useStudyStreak } from './hooks';
import { Emoji } from './topic';

/** Chip chuỗi ngày học ở sidebar (hướng B): "🔥 5 ngày"; hôm nay chưa học → icon xám + nhắc. */
export function StreakBadge() {
  const streak = useStudyStreak();
  if (!streak || streak.count === 0) return null;
  return (
    <p
      data-testid="streak-badge"
      data-today={streak.today}
      title={streak.today ? undefined : t('streak.keep')}
      className="flex items-center gap-2 self-start rounded-full bg-surface px-3 py-1 text-sm font-semibold shadow-card"
    >
      <Emoji size="sm" className={cn('text-base', !streak.today && 'opacity-40 grayscale')}>
        🔥
      </Emoji>
      <span className={streak.today ? 'text-streak' : 'text-muted-foreground'}>
        {t('streak.days', { n: streak.count })}
      </span>
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
