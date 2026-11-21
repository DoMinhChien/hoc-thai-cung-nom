import {
  compareUnits,
  continueTarget,
  unitLessonProgress,
  unitEmoji,
  unitStatus,
  type ContinueTarget,
  type TopicColor,
  type LessonProgressRecord,
  type UnitSummary,
} from '@nom/core';
import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Emoji, TopicTile, useTopicColors } from '@/components/fun';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnits } from '@/content/hooks';
import { unitLabel } from '@/content/labels';
import { useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { Badge, LoadError } from './parts';

type Kind = 'theme' | 'grammar';

/** Lưới 2 cột (hướng B): ←→ sang thẻ bên, ↑↓ sang hàng (SCR-04 §A, phím giữ nguyên). */
const GRID_KEYS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -2,
  ArrowDown: 2,
};

/** `/units` — lộ trình Giáo trình → Chuyên đề (SCR-04 §A, P-04, P-10, plan 0.11 #1, 0.12 #1). */
export function UnitsPage() {
  const content = useUnits();
  const records = useRepositoryQuery((r) => r.progress.listLessonProgress(), []);
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') as Kind | null;

  return (
    <section data-testid="page-units" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{t('pages.units')}</h1>
        <p className="text-muted-foreground">{t('units.intro')}</p>
      </header>
      {content.status === 'loading' || records === undefined ? (
        <div className="grid grid-cols-2 gap-4" aria-label={t('units.loading')}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[176px] rounded-xl" />
          ))}
        </div>
      ) : content.status === 'error' ? (
        <LoadError kind={content.error.kind} />
      ) : content.data.length === 0 ? (
        <p className="text-muted-foreground">{t('units.empty')}</p>
      ) : (
        <Path
          units={content.data}
          records={records}
          kind={kind}
          onKind={(k) => setParams(k ? { kind: k } : {}, { replace: true })}
        />
      )}
    </section>
  );
}

function Path({
  units,
  records,
  kind,
  onKind,
}: {
  units: UnitSummary[];
  records: LessonProgressRecord[];
  kind: Kind | null;
  onKind: (kind: Kind | null) => void;
}) {
  const navigate = useNavigate();
  const colors = useTopicColors(units);
  const sorted = [...units].sort(compareUnits);
  const target = continueTarget(sorted, records);
  const kinds = new Set(sorted.map((u) => u.kind));
  const shown = kind ? sorted.filter((u) => u.kind === kind) : sorted;
  const rows = useRef<(HTMLAnchorElement | null)[]>([]);
  const [focus, setFocus] = useState(0);

  const goContinue = () => {
    if (!target) return;
    navigate(target.kind === 'done' ? '/practice' : `/units/${target.unitId}/${target.lessonId}`);
  };
  useKeyShortcut('Enter', goContinue, !!target);
  const move = (delta: number) => {
    const next = Math.max(0, Math.min(shown.length - 1, focus + delta));
    setFocus(next);
    rows.current[next]?.focus();
  };

  return (
    <>
      {target && (
        <ContinueCard
          target={target}
          units={sorted}
          records={records}
          color={colors.get(target.unitId)}
          onGo={goContinue}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {kinds.size > 1 ? (
          <div
            role="group"
            aria-label={t('units.filterLabel')}
            className="flex rounded-lg border bg-surface p-0.5"
          >
            {([null, 'theme', 'grammar'] as const).map((k) => (
              <button
                key={k ?? 'all'}
                type="button"
                aria-pressed={kind === k}
                data-testid={`units-filter-${k ?? 'all'}`}
                onClick={() => onKind(k)}
                className={cn(
                  'rounded px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  kind === k
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {k === 'theme'
                  ? t('units.filterTheme')
                  : k === 'grammar'
                    ? t('units.filterGrammar')
                    : t('units.filterAll')}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <span className="text-sm text-muted-foreground">
          {t(`units.count.${kind ?? 'all'}`, { n: shown.length })}
        </span>
      </div>

      <ul data-testid="unit-path" className="grid grid-cols-2 gap-4">
        {shown.map((unit, i) => {
          const status = unitStatus(unit.lessons, records);
          const progress = unitLessonProgress(unit.lessons, records);
          const color = colors.get(unit.unit_id);
          return (
            <li key={unit.unit_id} data-topic={color}>
              <Link
                ref={(el) => {
                  rows.current[i] = el;
                }}
                to={`/units/${unit.unit_id}`}
                data-testid={`unit-row-${unit.unit_id}`}
                data-status={status}
                tabIndex={i === focus ? 0 : -1}
                onFocus={() => setFocus(i)}
                onKeyDown={(e) => {
                  const delta = GRID_KEYS[e.key];
                  if (delta) {
                    e.preventDefault();
                    move(delta);
                  }
                }}
                className="flex h-full flex-col overflow-hidden rounded-xl border bg-surface shadow-card outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-shadow"
              >
                <span className="flex h-[88px] items-center gap-4 bg-topic-subtle px-5">
                  <Emoji size="md">{unitEmoji(unit)}</Emoji>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-topic" data-testid="unit-label">
                      {unitLabel(unit)}
                    </span>
                    <span
                      className="text-sm font-medium"
                      data-testid={`unit-status-${unit.unit_id}`}
                    >
                      {status === 'completed'
                        ? t('units.done')
                        : status === 'in-progress'
                          ? t('units.inProgress', { x: progress.completed, y: progress.total })
                          : t('units.notStarted')}
                    </span>
                  </span>
                  <span className="ml-auto flex gap-1.5">
                    {unit.level && <Badge>{unit.level}</Badge>}
                    {unit.draft && <Badge muted>{t('units.draft')}</Badge>}
                  </span>
                </span>
                <span className="flex flex-1 flex-col gap-1 px-5 pt-3 pb-4">
                  <span className="text-lg font-semibold">{unit.title_vi}</span>
                  {unit.title_th && (
                    <span lang="th" className="text-th-sm text-muted-foreground">
                      {unit.title_th}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {t('units.stats', {
                      lessons: unit.lessons.length,
                      words: unit.words,
                      sentences: unit.sentences,
                    })}
                  </span>
                  <span
                    role="progressbar"
                    aria-label={t('units.progressLabel', { title: unit.title_vi })}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress.percent}
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-topic"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{t('units.source')}</p>
    </>
  );
}

function ContinueCard({
  target,
  units,
  records,
  color,
  onGo,
}: {
  target: ContinueTarget;
  units: UnitSummary[];
  records: LessonProgressRecord[];
  color: TopicColor | undefined;
  onGo: () => void;
}) {
  const unit = units.find((u) => u.unit_id === target.unitId)!;
  const lesson = unit.lessons.find((l) => l.lesson_id === target.lessonId)!;
  const record = records.find((r) => r.lessonId === lesson.lesson_id);
  const text =
    target.kind === 'done'
      ? t('units.allDone')
      : target.kind === 'start'
        ? t('units.startWith', { unit: unitLabel(unit), title: unit.title_vi })
        : target.kind === 'next'
          ? t('units.nextLesson', {
              unit: unitLabel(unit),
              lesson: lesson.order,
              title: lesson.title_vi,
            })
          : `${unitLabel(unit)} · ${unit.title_vi}`;
  return (
    <div
      data-testid="continue-card"
      data-kind={target.kind}
      data-topic={color}
      className="flex items-center gap-6 rounded-xl bg-topic-subtle p-6"
    >
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-lg font-semibold">{text}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {target.kind === 'continue' && (
            <p className="text-sm text-muted-foreground">
              {t('units.continueLine', {
                n: lesson.order,
                title: lesson.title_vi,
                done: record?.stepsDone.length ?? 0,
                total: lesson.steps.length,
              })}
            </p>
          )}
          <Button
            data-testid="continue-button"
            size="lg"
            className="ml-auto"
            aria-keyshortcuts="Enter"
            onClick={onGo}
          >
            {target.kind === 'done'
              ? t('units.practice')
              : target.kind === 'start'
                ? t('units.start')
                : t('units.continue')}
            <kbd aria-hidden className="rounded bg-primary-foreground/20 px-1.5 font-sans text-xs">
              ↵
            </kbd>
          </Button>
        </div>
      </div>
      <TopicTile unit={unit} color={color} size="xl" className="bg-surface/60" />
    </div>
  );
}
