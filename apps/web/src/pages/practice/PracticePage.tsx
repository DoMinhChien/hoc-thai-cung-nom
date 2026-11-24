import {
  compareUnits,
  PRACTICE_FILTER_KEY,
  PRACTICE_FILTERS,
  type PracticeFilter,
} from '@nom/core';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { StreakCard, useStudyStreak } from '@/components/fun';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { unitLabel } from '@/content/labels';
import { useRepositories } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { speakingEnabled } from '@/speaking/flag';
import { usePracticeData, usePracticeToday, type PracticeData } from './usePracticeData';

/** `/practice` — Bài tập (SCR-06 §A). `?unit=` mở thẳng phiên luyện của unit. */
export function PracticePage() {
  const [params] = useSearchParams();
  const state = usePracticeData();
  const unit = params.get('unit');
  if (unit) return <Navigate to={`/practice/session?unit=${unit}`} replace />;

  return (
    <section data-testid="page-practice" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">{t('pages.practice')}</h1>
        <p className="text-muted-foreground">{t('practice.intro')}</p>
      </header>
      <PracticeStreak />
      {state.status === 'loading' ? (
        <Skeleton className="h-40" role="status" aria-label={t('practice.loading')} />
      ) : state.status === 'error' ? (
        <p>{t('practice.loadError')}</p>
      ) : (
        <Hub data={state.data} />
      )}
    </section>
  );
}

function Hub({ data }: { data: PracticeData }) {
  const navigate = useNavigate();
  const repos = useRepositories();
  // Cập nhật ngay khi chọn (ghi cài đặt là bất đồng bộ).
  const [filter, setFilter] = useState(data.filter);
  const { overview, today, started } = usePracticeToday(data, filter);
  const todayCount = today.count;
  const learnedUnits = new Set(data.lessons.map((l) => l.unitId));
  const start = () => navigate('/practice/session');
  const mistakes = () => navigate('/practice/session?mode=mistakes');
  useKeyShortcut('Enter', start, started && todayCount > 0);
  useKeyShortcut(['w', 'W'], mistakes, overview.mistakes > 0);

  const units = data.bundles
    .filter((b) => learnedUnits.has(b.unit.unit_id))
    .sort((a, b) => compareUnits(a.unit, b.unit));

  return (
    <>
      <div data-testid="practice-today" className="flex flex-col gap-4 rounded-lg bg-accent p-6">
        <h2 className="text-lg font-semibold">{t('practice.today')}</h2>
        {!started ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p data-testid="practice-today-state" data-state="not-started">
              {t('practice.noLessons')}
            </p>
            <Button asChild>
              <Link to="/units">{t('practice.toUnits')}</Link>
            </Button>
          </div>
        ) : todayCount === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p data-testid="practice-today-state" data-state="done">
              {t('practice.doneToday', { n: overview.dueTomorrow })}
            </p>
            <Button variant="outline" asChild>
              <Link to="/practice/session?mode=more" data-testid="practice-more">
                {t('practice.more')}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <p data-testid="practice-today-state" data-state="ready">
              {t('practice.dueLine', {
                n: todayCount,
                words: today.words,
                sentences: today.sentences,
                min: today.minutes,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">{t('practice.goal')}</span>
              <div
                role="progressbar"
                aria-label={t('practice.goal')}
                aria-valuemin={0}
                aria-valuemax={data.size}
                aria-valuenow={Math.min(overview.doneToday, data.size)}
                className="h-2 w-40 overflow-hidden rounded-full bg-background"
              >
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, (overview.doneToday / data.size) * 100)}%` }}
                />
              </div>
              <span className="text-sm tabular-nums" data-testid="practice-goal">
                {t('practice.goalValue', { done: overview.doneToday, goal: data.size })}
              </span>
              <Button
                className="ml-auto"
                data-testid="practice-start"
                aria-keyshortcuts="Enter"
                onClick={start}
              >
                {t('practice.start')}
                <kbd
                  aria-hidden
                  className="rounded bg-primary-foreground/20 px-1.5 font-sans text-xs"
                >
                  ↵
                </kbd>
              </Button>
            </div>
          </>
        )}
      </div>

      {speakingEnabled() && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-5"
          data-testid="practice-speaking"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">{t('speaking.cardTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('speaking.cardLine')}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/practice/speaking" data-testid="practice-speaking-open">
              {t('speaking.cardOpen')}
            </Link>
          </Button>
        </div>
      )}

      {started && (
        <div className="grid gap-4 md:grid-cols-2">
          {overview.mistakes > 0 && (
            <div
              className="flex flex-col gap-3 rounded-lg border p-5"
              data-testid="practice-mistakes"
            >
              <h2 className="font-semibold">{t('practice.mistakes')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('practice.mistakesLine', { n: overview.mistakes })}
              </p>
              <Button
                variant="outline"
                className="self-start"
                aria-keyshortcuts="W"
                onClick={mistakes}
              >
                {t('practice.mistakes')}{' '}
                <kbd className="font-sans text-xs text-muted-foreground">W</kbd>
              </Button>
            </div>
          )}
          <fieldset
            className="flex flex-col gap-3 rounded-lg border p-5"
            data-testid="practice-filter"
          >
            <legend className="px-1 font-semibold">{t('practice.filter')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {PRACTICE_FILTERS.map((f: PracticeFilter) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="practice-filter"
                    value={f}
                    checked={filter === f}
                    data-testid={`practice-filter-${f}`}
                    onChange={() => {
                      setFilter(f);
                      void repos?.settings.set(PRACTICE_FILTER_KEY, f);
                    }}
                    className="size-4 accent-primary"
                  />
                  {t(`practice.filters.${f}`)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {units.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('practice.byUnit')}</h2>
          <ul className="divide-y rounded-lg border" data-testid="practice-units">
            {units.map(({ unit }) => {
              const words = data.pool.words.filter((w) => w.unitId === unit.unit_id).length;
              const sentences = data.pool.sentences.filter((s) => s.unitId === unit.unit_id).length;
              const accuracy = overview.accuracy[unit.unit_id];
              const label = unitLabel(unit);
              return (
                <li
                  key={unit.unit_id}
                  className="flex flex-wrap items-center gap-4 px-4 py-3"
                  data-testid={`practice-unit-${unit.unit_id}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span>
                      <span className="text-sm text-muted-foreground">{label}</span>{' '}
                      <span className="font-medium">{unit.title_vi}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t('practice.unitStats', { words, sentences })}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'text-sm tabular-nums',
                      accuracy === undefined && 'text-muted-foreground',
                    )}
                  >
                    {accuracy === undefined
                      ? '—'
                      : t('practice.accuracy', { n: Math.round(accuracy * 100) })}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/practice/session?unit=${unit.unit_id}`}
                      aria-label={t('practice.practiceUnitLabel', { unit: label })}
                    >
                      {t('practice.practiceUnit')}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

/** Khối chuỗi ngày học đầu trang Bài tập (M0.5c hướng B); chưa học ngày nào → ẩn. */
function PracticeStreak() {
  const streak = useStudyStreak();
  if (!streak || (streak.count === 0 && !streak.week.some((d) => d.studied))) return null;
  return <StreakCard streak={streak} />;
}
