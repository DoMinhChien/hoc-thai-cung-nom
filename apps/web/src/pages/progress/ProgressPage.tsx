import {
  accuracyByExerciseType,
  activityByDay,
  canDoChecklist,
  compareUnits,
  countMastery,
  DEFAULT_PRACTICE_SESSION_SIZE,
  dueForecast,
  gameReport,
  grammarMistakes,
  hardItems,
  MIN_REPORT_SAMPLES,
  PRACTICE_FILTER_KEY,
  PRACTICE_SESSION_SIZE_KEY,
  retention,
  skillAccuracy,
  studyStreak,
  studyTime,
  unitLessonProgress,
  unitStatus,
  type CanDoRecord,
  type CardRecord,
  type ExerciseAttemptRecord,
  type GameResultRecord,
  type LessonProgressRecord,
  type MasteryCounts,
  type NeedsReviewRecord,
  type PracticeFilter,
  type ReviewLogRecord,
  type SessionRecord,
  type UnitBundle,
} from '@nom/core';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/auth/useAuth';
import { useKeyShortcut } from '@/components/interactive';
import { ProgressRing, StackedProgressBar } from '@/components/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllUnits } from '@/content/hooks';
import { unitLabel } from '@/content/labels';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatRecord, gameName } from '../games/catalog';
import { SpeakButton } from '../units/parts';
import { BarChart } from './charts';

const SHOW_TABLE_KEY = 'progressShowTable';
const EPOCH = new Date(0);
const numberFormat = new Intl.NumberFormat('vi-VN');
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;
/** `YYYY-MM-DD` → `dd/MM` (SCR-09 §Quy tắc biểu đồ #7). */
const dayLabel = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const weekday = (day: string) => WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()]!;

/** `/progress` — Tiến độ (SCR-09, P-01..P-12, R-01'..R-07): báo cáo tính hoàn toàn trên máy. */
export function ProgressPage() {
  const auth = useAuth();
  const content = useAllUnits();
  const records = useRepositoryQuery(async (r) => {
    const now = new Date();
    const end = new Date(now.getTime() + 1);
    const [cards, logs, attempts, sessions, lessons, games, flags, size, showTable] =
      await Promise.all([
        r.progress.listCards(),
        r.reviews.logsBetween(EPOCH, end),
        r.reviews.attemptsBetween(EPOCH, end),
        r.sessions.listBetween(EPOCH, end),
        r.progress.listLessonProgress(),
        r.progress.listGameResults(),
        r.progress.listNeedsReview(),
        r.settings.get(PRACTICE_SESSION_SIZE_KEY, DEFAULT_PRACTICE_SESSION_SIZE),
        r.settings.get(SHOW_TABLE_KEY, false),
      ]);
    return { now, cards, logs, attempts, sessions, lessons, games, flags, size, showTable };
  }, []);
  const unitIds = content.status === 'ready' ? content.data.map((b) => b.unit.unit_id) : [];
  const canDos = useRepositoryQuery(
    async (r) => (await Promise.all(unitIds.map((id) => r.progress.listCanDo(id)))).flat(),
    [unitIds.join()],
  );

  return (
    <section data-testid="page-progress" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">{t('pages.progress')}</h1>
        <p className="text-muted-foreground">
          {t('report.intro')}
          {auth.status === 'guest' && ` · ${t('report.guest')}`}
        </p>
      </header>
      {content.status === 'error' && (
        <p role="alert" className="rounded-xl bg-destructive-subtle p-4">
          {t('report.contentError')}
        </p>
      )}
      {!records || content.status === 'loading' || !canDos ? (
        <div className="flex flex-col gap-4" role="status" aria-label={t('report.loading')}>
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <Report
          bundles={content.status === 'ready' ? content.data : []}
          canDos={canDos}
          {...records}
        />
      )}
    </section>
  );
}

interface Records {
  now: Date;
  cards: CardRecord[];
  logs: ReviewLogRecord[];
  attempts: ExerciseAttemptRecord[];
  sessions: SessionRecord[];
  lessons: LessonProgressRecord[];
  games: GameResultRecord[];
  flags: NeedsReviewRecord[];
  size: number;
  showTable: boolean;
}

function Report({
  bundles,
  canDos,
  now,
  cards,
  logs,
  attempts,
  sessions,
  lessons,
  games,
  flags,
  size,
  showTable,
}: Records & {
  bundles: UnitBundle[];
  canDos: CanDoRecord[];
}) {
  const repos = useRepositories();
  const navigate = useNavigate();
  const offset = -now.getTimezoneOffset();
  const units = useMemo(() => [...bundles].sort((a, b) => compareUnits(a.unit, b.unit)), [bundles]);
  const of = (type: 'word' | 'sentence') => cards.filter((c) => c.itemType === type);
  const idsOf = (type: 'word' | 'sentence') => [...new Set(of(type).map((c) => c.itemId))];
  const words = countMastery(idsOf('word'), of('word'));
  const sentences = countMastery(idsOf('sentence'), of('sentence'));
  const lessonsTotal = units.reduce((n, u) => n + u.lessons.length, 0);
  const lessonsDone = lessons.filter((l) => l.completedAt).length;
  const unitsDone = units.filter((u) => unitStatus(u.lessons, lessons) === 'completed').length;
  const goals = units.flatMap((u) =>
    canDoChecklist(
      { can_do: u.unit.can_do, lessons: u.lessons },
      lessons,
      canDos.filter((c) => c.unitId === u.unit.unit_id),
    ),
  );
  const started = cards.length > 0 || lessons.length > 0 || attempts.length > 0;

  const streak = studyStreak(
    [
      ...attempts.map((a) => a.ts),
      ...logs.map((l) => l.review),
      ...sessions.map((s) => s.startedAt),
      ...lessons.filter((l) => l.stepsDone.length > 0).map((l) => l.updatedAt),
      ...games.map((g) => g.lastPlayedAt),
    ],
    now,
    offset,
  );

  useKeyShortcut('w', () => navigate('/practice/session?mode=mistakes'), started);

  return (
    <>
      <section aria-labelledby="report-overview">
        <h2 id="report-overview" className="sr-only">
          {t('report.overview')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-3 tablet:gap-4 xl:grid-cols-5">
          <Tile
            to="/words?level=mastered"
            testId="report-words"
            value={`${words.mastered}/${words.total}`}
            label={t('report.wordsMastered')}
            ring={words.total ? Math.round((words.mastered / words.total) * 100) : 0}
          />
          <Tile
            to="#cau"
            testId="report-sentences"
            value={String(sentences.total)}
            label={t('report.sentences')}
          />
          <Tile
            to="/units"
            testId="report-lessons"
            value={`${lessonsDone}/${lessonsTotal}`}
            label={t('report.lessonsDone')}
          />
          <Tile
            to="#lo-trinh"
            testId="report-units"
            value={`${unitsDone}/${units.length}`}
            label={t('report.unitsDone')}
          />
          <Tile
            to="#lo-trinh"
            testId="report-goals"
            value={`${goals.filter((g) => g.checked).length}/${goals.length}`}
            label={t('report.goals')}
          />
        </ul>
      </section>

      {!started ? (
        <div
          data-testid="report-empty"
          className="flex flex-col items-center gap-3 rounded-xl border bg-surface p-10 text-center shadow-card"
        >
          <h2 className="text-xl font-semibold">{t('report.emptyTitle')}</h2>
          <p className="text-muted-foreground">{t('report.emptyBody')}</p>
          <Button asChild>
            <Link to="/units">{t('report.emptyStart')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <Activity
            now={now}
            offset={offset}
            attempts={attempts}
            logs={logs}
            cards={cards}
            sessions={sessions}
            goal={size}
            streak={streak}
            showTable={showTable}
            onToggleTable={() => void repos?.settings.set(SHOW_TABLE_KEY, !showTable)}
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Memory
              now={now}
              offset={offset}
              words={words}
              sentences={sentences}
              logs={logs}
              cards={cards}
            />
            <Skills
              now={now}
              attempts={attempts}
              words={words}
              onPractice={async (filter) => {
                await repos?.settings.set(PRACTICE_FILTER_KEY, filter);
                navigate('/practice');
              }}
            />
          </div>
          <Roadmap units={units} lessons={lessons} cards={cards} canDos={canDos} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Mistakes now={now} attempts={attempts} units={units} />
            <HardItems logs={logs} cards={cards} units={units} />
          </div>
          <Games games={games} flags={flags.filter((f) => f.origin === 'game').length} />
        </>
      )}
    </>
  );
}

function Card({
  id,
  title,
  aside,
  children,
  testId,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  testId: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-testid={testId}
      className="flex scroll-mt-6 flex-col gap-4 rounded-xl border bg-surface p-6 shadow-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Tile({
  to,
  testId,
  value,
  label,
  ring,
}: {
  to: string;
  testId: string;
  value: string;
  label: string;
  ring?: number;
}) {
  const body = (
    <>
      <span className="flex items-center gap-2">
        {ring !== undefined && (
          <ProgressRing percent={ring} label={label} size={32} className="[&>span]:sr-only" />
        )}
        <span className="text-2xl font-bold tabular-nums">{value}</span>
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </>
  );
  const cls =
    'flex h-full flex-col gap-1 rounded-xl border bg-surface p-4 shadow-card outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <li>
      {to.startsWith('#') ? (
        <a href={to} data-testid={testId} className={cls}>
          {body}
        </a>
      ) : (
        <Link to={to} data-testid={testId} className={cls}>
          {body}
        </Link>
      )}
    </li>
  );
}

const duration = (ms: number) => {
  const minutes = Math.round(ms / 60_000);
  return t('report.time', { h: Math.floor(minutes / 60), m: minutes % 60 });
};

function Activity({
  now,
  offset,
  attempts,
  logs,
  cards,
  sessions,
  goal,
  streak,
  showTable,
  onToggleTable,
}: {
  now: Date;
  offset: number;
  attempts: Records['attempts'];
  logs: Records['logs'];
  cards: Records['cards'];
  sessions: Records['sessions'];
  goal: number;
  streak: ReturnType<typeof studyStreak>;
  showTable: boolean;
  onToggleTable: () => void;
}) {
  const days = activityByDay({ attempts, logs, cards }, now, 30, offset);
  const active = days.filter((d) => d.count > 0);
  const total = days.reduce((n, d) => n + d.count, 0);
  const peak = days.reduce((a, d) => (d.count > a.count ? d : a), days[0]!);
  const time = studyTime({ sessions, attempts, logs });
  const met = (d: (typeof days)[number]) => d.practiced >= goal;
  return (
    <Card
      id="hoat-dong"
      testId="report-activity"
      title={t('report.activity')}
      aside={
        <span className="text-sm text-muted-foreground" data-testid="report-streak">
          {streak.count
            ? t('report.streak', { n: streak.count, m: streak.longest })
            : t('report.noStreak')}
        </span>
      }
    >
      <BarChart
        testId="report-chart"
        bars={days.map((d, i) => ({
          key: d.day,
          value: d.count,
          label: dayLabel(d.day),
          strong: i === days.length - 1,
          tip: `${weekday(d.day)}, ${dayLabel(d.day)}: ${t('report.count', { n: d.count })}${met(d) ? ` · ${t('report.goalMet')}` : ''}`,
        }))}
        goal={goal}
        goalLabel={t('report.goalLine', { n: goal })}
        labelEvery={7}
        summary={t('report.chartSummary', {
          d: active.length,
          avg: active.length ? Math.round(total / active.length) : 0,
          max: peak.count,
          day: dayLabel(peak.day),
        })}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span data-testid="report-activity-line">
          {t('report.activityLine', { d: active.length, n: numberFormat.format(total) })} ·{' '}
          {duration(time)}
        </span>
        <Button variant="ghost" size="sm" aria-pressed={showTable} onClick={onToggleTable}>
          {showTable ? t('report.hideTable') : t('report.showTable')}
        </Button>
      </div>
      {showTable && (
        <table className="w-full text-sm" data-testid="report-table">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">{t('report.day')}</th>
              <th className="py-1 font-medium">{t('report.turns')}</th>
              <th className="py-1 font-medium">{t('report.goalMet')}</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.day} className="border-t">
                <td className="py-1">
                  {weekday(d.day)}, {dayLabel(d.day)}
                </td>
                <td className="py-1 tabular-nums">{d.count}</td>
                <td className="py-1">{met(d) ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

const percent = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);

function Memory({
  now,
  offset,
  words,
  sentences,
  logs,
  cards,
}: {
  now: Date;
  offset: number;
  words: MasteryCounts;
  sentences: MasteryCounts;
  logs: Records['logs'];
  cards: Records['cards'];
}) {
  const forecast = dueForecast(
    cards.filter((c) => c.itemType === 'word' || c.itemType === 'sentence'),
    now,
    offset,
  );
  return (
    <Card id="cau" testId="report-memory" title={t('report.memory')}>
      {(
        [
          ['report.words', words],
          ['report.sentencesShort', sentences],
        ] as const
      ).map(([label, counts]) => (
        <div key={label} className="flex flex-col gap-1">
          <p className="flex items-center justify-between text-sm">
            <span className="font-medium">{t(label)}</span>
            <span className="tabular-nums">{counts.total}</span>
          </p>
          <StackedProgressBar counts={counts} label={t(label)} />
        </div>
      ))}
      <p className="text-sm" data-testid="report-retention">
        {t('report.retention', {
          a: percent(retention(logs, now, 7)),
          b: percent(retention(logs, now, 30)),
        })}
      </p>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{t('report.forecast')}</p>
        <BarChart
          testId="report-forecast"
          height={48}
          bars={forecast.days.map((d) => ({
            key: d.day,
            value: d.count,
            label: weekday(d.day),
            tip: `${weekday(d.day)}, ${dayLabel(d.day)}: ${t('report.dueCount', { n: d.count })}`,
          }))}
          summary={t('report.forecastSummary', {
            n: forecast.days.reduce((n, d) => n + d.count, 0),
          })}
        />
        <p className="text-sm text-muted-foreground">
          {t('report.next30', { n: forecast.next30 })}
        </p>
      </div>
    </Card>
  );
}

const SKILL_FILTER: Record<'vocab' | 'th-vi' | 'vi-th' | 'listening', PracticeFilter> = {
  vocab: 'vocab',
  'th-vi': 'sentences',
  'vi-th': 'typing',
  listening: 'all',
};

function Skills({
  now,
  attempts,
  words,
  onPractice,
}: {
  now: Date;
  attempts: Records['attempts'];
  words: MasteryCounts;
  onPractice: (filter: PracticeFilter) => void;
}) {
  const acc = skillAccuracy(attempts, now);
  const rows = [
    {
      key: 'vocab' as const,
      ratio: words.total ? words.mastered / words.total : null,
      total: words.total,
      ok: words.total > 0,
    },
    ...(['th-vi', 'vi-th', 'listening'] as const).map((k) => ({
      key: k,
      ratio: acc[k].ratio,
      total: acc[k].total,
      ok: acc[k].total >= MIN_REPORT_SAMPLES,
    })),
  ];
  const weakest = rows
    .filter((r) => r.ok && r.ratio !== null && r.ratio < 0.6)
    .sort((a, b) => a.ratio! - b.ratio!)[0];
  return (
    <Card id="ky-nang" testId="report-skills" title={t('report.skills')}>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm">
            <span>{t(`report.skill.${r.key}`)}</span>
            <span
              role="meter"
              aria-label={t(`report.skill.${r.key}`)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={r.ok && r.ratio !== null ? Math.round(r.ratio * 100) : 0}
              aria-valuetext={
                r.ok && r.ratio !== null
                  ? t('report.percentText', { n: Math.round(r.ratio * 100) })
                  : t('report.notEnough', { n: r.total })
              }
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <span
                className={cn('block h-full rounded-full', r.ok ? 'bg-primary' : 'bg-transparent')}
                style={{ width: `${r.ok && r.ratio !== null ? r.ratio * 100 : 0}%` }}
              />
            </span>
            <span className="flex items-center gap-2 tabular-nums">
              {r.ok && r.ratio !== null
                ? `${Math.round(r.ratio * 100)}%`
                : t('report.notEnough', { n: r.total })}
              {weakest?.key === r.key && (
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => onPractice(SKILL_FILTER[r.key])}
                >
                  {t('report.practice')} ›
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t('report.skillsNote')}</p>
    </Card>
  );
}

function Roadmap({
  units,
  lessons,
  cards,
  canDos,
}: {
  units: UnitBundle[];
  lessons: Records['lessons'];
  cards: Records['cards'];
  canDos: CanDoRecord[];
}) {
  const [kind, setKind] = useState<'theme' | 'grammar' | null>(null);
  const [all, setAll] = useState(false);
  const wordCards = cards.filter((c) => c.itemType === 'word');
  const kinds = new Set(units.map((u) => u.unit.kind));
  const inKind = units.filter((u) => !kind || u.unit.kind === kind);
  const startedIdx = inKind.map((u) => unitStatus(u.lessons, lessons) !== 'not-started');
  const lastStarted = startedIdx.lastIndexOf(true);
  const shown = all ? inKind : inKind.filter((_, i) => startedIdx[i] || i === lastStarted + 1);
  const hidden = inKind.length - shown.length;
  return (
    <Card
      id="lo-trinh"
      testId="report-roadmap"
      title={t('report.roadmap')}
      aside={
        kinds.size > 1 && (
          <div
            role="group"
            aria-label={t('units.filterLabel')}
            className="flex rounded-lg border p-0.5"
          >
            {([null, 'theme', 'grammar'] as const).map((k) => (
              <button
                key={k ?? 'all'}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
        )
      }
    >
      <ul className="flex flex-col">
        {shown.map((u) => {
          const status = unitStatus(u.lessons, lessons);
          const p = unitLessonProgress(u.lessons, lessons);
          const ids = u.words.map((w) => w.id);
          const m = countMastery(
            ids,
            wordCards.filter((c) => ids.includes(c.itemId)),
          );
          const pct = ids.length ? Math.round((m.mastered / ids.length) * 100) : null;
          const goals = canDoChecklist(
            { can_do: u.unit.can_do, lessons: u.lessons },
            lessons,
            canDos.filter((c) => c.unitId === u.unit.unit_id),
          );
          return (
            <li key={u.unit.unit_id} className="border-b last:border-b-0">
              <Link
                to={`/units/${u.unit.unit_id}`}
                data-testid={`report-unit-${u.unit.unit_id}`}
                className="grid min-h-11 grid-cols-[1.5rem_minmax(0,1fr)_7rem] items-center gap-3 tablet:grid-cols-[1.5rem_minmax(0,1fr)_5rem_9rem_6rem] py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden>
                  {status === 'completed' ? '●' : status === 'in-progress' ? '◐' : '○'}
                </span>
                <span className="truncate">
                  <span className="sr-only">{t(`report.status.${status}`)} · </span>
                  <span className="font-medium">{unitLabel(u.unit)}</span> {u.unit.title_vi}
                </span>
                <span className="tabular-nums max-tablet:hidden">
                  {t('report.unitLessons', { x: p.completed, y: p.total })}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </span>
                  <span className="w-9 text-right tabular-nums">
                    {pct === null ? '—' : `${pct}%`}
                  </span>
                </span>
                <span className="tabular-nums max-tablet:hidden">
                  {t('report.unitGoals', {
                    x: goals.filter((g) => g.checked).length,
                    y: goals.length,
                  })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setAll(true)}>
          {t('report.showAllUnits', { n: hidden })}
        </Button>
      )}
    </Card>
  );
}

function Mistakes({
  now,
  attempts,
  units,
}: {
  now: Date;
  attempts: Records['attempts'];
  units: UnitBundle[];
}) {
  const grammarOf = new Map(
    units.flatMap((u) =>
      u.sentences.flatMap((s) => (s.grammar_id ? [[s.id, s.grammar_id] as const] : [])),
    ),
  );
  const grammar = new Map(
    units.flatMap((u) => u.grammar.map((g) => [g.id, { g, unit: u.unit }] as const)),
  );
  const top = grammarMistakes(attempts, grammarOf, now);
  const types = accuracyByExerciseType(attempts, now);
  const none = top.length === 0 && types.every((x) => x.correct === x.total);
  return (
    <Card id="loi" testId="report-mistakes" title={t('report.mistakes')}>
      {none ? (
        <p>{t('report.noMistakes')}</p>
      ) : (
        <>
          {top.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t('report.byGrammar')}</p>
              <ul className="flex flex-col">
                {top.map((m) => {
                  const info = grammar.get(m.grammarId);
                  return (
                    <li
                      key={m.grammarId}
                      className="flex min-h-11 items-center gap-2 border-b text-sm last:border-b-0"
                    >
                      {info ? (
                        <Link
                          to={`/units/${info.unit.unit_id}`}
                          className="flex flex-1 items-baseline gap-2 hover:underline"
                        >
                          <span lang="th" className="text-th-sm">
                            {info.g.pattern}
                          </span>
                          <span className="text-muted-foreground">{info.g.title_vi}</span>
                        </Link>
                      ) : (
                        <span className="flex-1">—</span>
                      )}
                      <span className="tabular-nums">
                        {t('report.wrongOf', { x: m.wrong, y: m.total })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {types.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t('report.byType')}</p>
              <p className="text-sm" data-testid="report-types">
                {types
                  .map(
                    (x) =>
                      `${t(`practice.prompt.${x.type}` as 'practice.prompt.E-01')} ${Math.round(x.ratio * 100)}%`,
                  )
                  .join(' · ')}
              </p>
            </div>
          )}
          <Button variant="outline" size="sm" className="self-start" asChild>
            <Link to="/practice/session?mode=mistakes" aria-keyshortcuts="W">
              {t('report.practiceMistakes')}
              <kbd className="font-sans text-xs text-muted-foreground">W</kbd>
            </Link>
          </Button>
        </>
      )}
    </Card>
  );
}

function HardItems({
  logs,
  cards,
  units,
}: {
  logs: Records['logs'];
  cards: Records['cards'];
  units: UnitBundle[];
}) {
  const items = hardItems(logs, cards);
  const words = new Map(units.flatMap((u) => u.words.map((w) => [w.id, w] as const)));
  const sentences = new Map(units.flatMap((u) => u.sentences.map((s) => [s.id, s] as const)));
  const rows = items.flatMap((i) => {
    if (i.itemType === 'word') {
      const w = words.get(i.itemId);
      return w ? [{ ...i, th: w.thai, vi: w.meaning_vi.join('; ') }] : [];
    }
    if (i.itemType === 'sentence') {
      const s = sentences.get(i.itemId);
      return s?.th ? [{ ...i, th: s.th, vi: s.vi }] : [];
    }
    return [];
  });
  if (rows.length < 3) return null;
  const href = `/practice/session?items=${rows
    .slice(0, 20)
    .map((r) => `${r.itemType}:${r.itemId}`)
    .join(',')}`;
  return (
    <Card id="kho" testId="report-hard" title={t('report.hard')}>
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li
            key={`${r.itemType}:${r.itemId}`}
            className="flex min-h-11 items-center gap-3 border-b text-sm last:border-b-0"
          >
            <span lang="th" className="max-w-40 truncate text-th-sm" title={r.th}>
              {r.th}
            </span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.vi}</span>
            <span className="tabular-nums">{t('report.lapses', { n: r.lapses })}</span>
            <SpeakButton text={r.th} />
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="self-start" asChild>
        <Link to={href} data-testid="report-hard-practice">
          {t('report.practiceGroup')}
        </Link>
      </Button>
    </Card>
  );
}

function Games({ games, flags }: { games: Records['games']; flags: number }) {
  const { played, unplayed } = gameReport(games);
  return (
    <Card id="tro-choi" testId="report-games" title={t('report.games')}>
      {played.length === 0 ? (
        <p>
          {t('report.noGames')}{' '}
          <Link to="/games" className="text-primary underline-offset-4 hover:underline">
            {t('report.tryGames')} ›
          </Link>
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {played.map((g) => (
              <li
                key={g.gameId}
                data-game={g.gameId}
                data-testid={`report-game-${g.gameId}`}
                className="flex flex-col gap-0.5 rounded-lg border p-3 text-sm"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span aria-hidden className="size-2.5 rounded-full bg-game" />
                  {gameName(g.gameId)}
                </span>
                <span>{t('games.record', { value: formatRecord(g.gameId, g.best) })}</span>
                <span className="text-muted-foreground">
                  {t('report.plays', { n: g.plays })} ·{' '}
                  {t('report.correctPct', {
                    n: g.best.total ? Math.round((g.best.correct / g.best.total) * 100) : 0,
                  })}
                </span>
              </li>
            ))}
          </ul>
          {unplayed.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('report.unplayed', { list: unplayed.map(gameName).join(', ') })}
            </p>
          )}
        </>
      )}
      {flags > 0 && (
        <Link
          to="/words?level=review"
          className="self-end text-sm text-primary underline-offset-4 hover:underline"
        >
          {t('report.gameReview', { n: flags })} ›
        </Link>
      )}
    </Card>
  );
}
