import {
  compareUnits,
  continueTarget,
  countMastery,
  resumeStep,
  unitLessonProgress,
  unitStatus,
  type ContinueTarget,
  type LessonProgressRecord,
  type UnitBundle,
} from '@nom/core';
import { Link, useNavigate } from 'react-router';
import { Emoji, StreakCard, TopicTile, useStudyStreak, useTopicColors } from '@/components/fun';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { unitLabel } from '@/content/labels';
import { useAuth } from '@/auth/useAuth';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { usePracticeData, usePracticeToday, type PracticeData } from '../practice/usePracticeData';

/** `/` — Tổng quan (SCR-03, P-08, P-10): hôm nay làm gì, chuỗi ngày, lộ trình, tóm tắt. */
export function HomePage() {
  const auth = useAuth();
  const state = usePracticeData();
  const name = auth.status === 'signed-in' ? firstName(auth.user.displayName) : null;
  return (
    <section data-testid="page-dashboard" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">
          {name ? t('home.hello', { name }) : t('home.helloGuest')}
        </h1>
        {state.status === 'ready' && (
          <p className="text-muted-foreground">
            {state.data.lessons.length || state.data.cards.length
              ? t('home.intro')
              : t('home.introNew')}
          </p>
        )}
      </header>
      {state.status === 'loading' ? (
        <div className="flex flex-col gap-4" role="status" aria-label={t('home.loading')}>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-[3fr_2fr]">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : state.status === 'error' ? (
        <p role="alert" className="rounded-xl bg-destructive-subtle p-4">
          {t('home.loadError')}
        </p>
      ) : (
        <Dashboard data={state.data} />
      )}
    </section>
  );
}

const firstName = (name: string | null | undefined) =>
  name ? name.trim().split(/\s+/).at(-1)!.slice(0, 24) : null;

function Dashboard({ data }: { data: PracticeData }) {
  const navigate = useNavigate();
  const { overview, today, started } = usePracticeToday(data);
  const streak = useStudyStreak();
  const units = [...data.bundles].sort((a, b) => compareUnits(a.unit, b.unit));
  const colors = useTopicColors(units.map(summaryOf));
  const target = continueTarget(
    units.map((b) => ({ unit_id: b.unit.unit_id, lessons: b.lessons })),
    data.lessons,
  );
  const goalReached = overview.doneToday >= data.size;
  // D3: Bài tập là chính khi còn câu đến hạn và chưa đạt mục tiêu ngày (owner Q1 a).
  const practiceFirst = started && today.count > 0 && !goalReached;

  const goLesson = () => {
    if (!target) return;
    if (target.kind === 'done') {
      const first = units[0]!;
      navigate(`/units/${first.unit.unit_id}/${first.lessons[0]!.lesson_id}`);
    } else navigate(`/units/${target.unitId}/${target.lessonId}`);
  };
  const goPractice = () =>
    navigate(today.count > 0 ? '/practice/session' : '/practice/session?mode=more');
  useKeyShortcut('Enter', practiceFirst ? goPractice : goLesson, !!target);
  useKeyShortcut('h', goLesson, !!target);
  useKeyShortcut('b', goPractice, started);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-[3fr_2fr]">
        {target ? (
          <ContinueCard
            target={target}
            units={units}
            records={data.lessons}
            color={colors.get(target.unitId)}
            primary={!practiceFirst}
            onGo={goLesson}
          />
        ) : (
          <p className="rounded-xl border bg-surface p-6 shadow-card">{t('units.empty')}</p>
        )}
        <section
          aria-labelledby="home-today"
          className="flex flex-col gap-4 rounded-xl border bg-surface p-5 shadow-card"
        >
          <h2 id="home-today" className="text-lg font-semibold">
            {t('home.today')}
          </h2>
          {streak && <StreakCard streak={streak} stacked className="border-0 p-0 shadow-none" />}
          {streak && streak.count === 0 && !started && (
            <p className="text-sm text-muted-foreground">{t('home.streakStart')}</p>
          )}
          <div className="flex flex-col gap-1.5" data-testid="home-goal">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t('practice.goal')}</span>
              <Link
                to="/settings#bai-tap"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('home.changeGoal')}
              </Link>
            </div>
            <div
              role="progressbar"
              aria-label={t('practice.goal')}
              aria-valuemin={0}
              aria-valuemax={data.size}
              aria-valuenow={Math.min(overview.doneToday, data.size)}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (overview.doneToday / data.size) * 100)}%` }}
              />
            </div>
            <p className="text-sm tabular-nums" data-testid="home-goal-value">
              {goalReached ? (
                <span className="font-semibold text-positive">✓ {t('home.goalReached')}</span>
              ) : (
                t('home.goalValue', { done: overview.doneToday, goal: data.size })
              )}
            </p>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="home-practice"
        data-testid="home-practice"
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-accent px-6 py-5"
      >
        <div className="flex flex-col gap-1">
          <h2 id="home-practice" className="text-lg font-semibold">
            {t('practice.today')}
          </h2>
          <p data-testid="home-practice-state">
            {!started
              ? t('home.practiceNew')
              : today.count > 0
                ? t('practice.dueLine', {
                    n: today.count,
                    words: today.words,
                    sentences: today.sentences,
                    min: today.minutes,
                  })
                : t('practice.doneToday', { n: overview.dueTomorrow })}
          </p>
        </div>
        {started && (
          <Button
            data-testid="home-practice-button"
            variant={practiceFirst ? 'default' : 'outline'}
            size={practiceFirst ? 'lg' : 'default'}
            aria-keyshortcuts={practiceFirst ? 'Enter B' : 'B'}
            onClick={goPractice}
          >
            {today.count > 0 ? t('home.practice') : t('practice.more')}
            <kbd aria-hidden className="rounded bg-muted px-1.5 font-sans text-xs text-foreground">
              {practiceFirst ? '↵' : 'B'}
            </kbd>
          </Button>
        )}
      </section>

      {units.length > 0 && <PathStrip units={units} records={data.lessons} target={target} />}

      {started ? (
        <Summary data={data} />
      ) : (
        <section
          aria-labelledby="home-how"
          className="flex flex-col gap-4 rounded-xl border bg-surface p-6 shadow-card"
        >
          <h2 id="home-how" className="text-lg font-semibold">
            {t('home.howTitle')}
          </h2>
          <ol className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
            {(['📖', '✍️', '🎮'] as const).map((e, i) => (
              <li key={e} className="flex items-center gap-3">
                <Emoji size="sm">{e}</Emoji>
                <span>
                  <span className="font-semibold">{i + 1}.</span>{' '}
                  {t(`home.how${i + 1}` as 'home.how1')}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {started && data.needsReview.length > 0 && (
        <section
          aria-labelledby="home-review-game"
          data-testid="home-review-game"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-surface px-6 py-5 shadow-card"
        >
          <div className="flex items-center gap-3">
            <Emoji size="sm">🎮</Emoji>
            <div className="flex flex-col gap-1">
              <h2 id="home-review-game" className="text-lg font-semibold">
                {t('games.reviewCardTitle')}
              </h2>
              <p>{t('games.reviewCardBody', { n: data.needsReview.length })}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="max-lg:min-h-11">
            <Link to="/games?source=review" data-testid="home-review-game-button">
              {t('games.reviewCardCta')}
            </Link>
          </Button>
        </section>
      )}
      {started && (
        <Link
          to="/games"
          data-testid="home-games"
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('home.games')} ›
        </Link>
      )}
    </>
  );
}

const summaryOf = (b: UnitBundle) => ({
  ...b.unit,
  lessons: b.lessons.map((l) => ({ ...l, words: 0, sentences: 0 })),
  words: b.words.length,
  sentences: b.sentences.length,
});

function ContinueCard({
  target,
  units,
  records,
  color,
  primary,
  onGo,
}: {
  target: ContinueTarget;
  units: UnitBundle[];
  records: LessonProgressRecord[];
  color: ReturnType<ReturnType<typeof useTopicColors>['get']>;
  primary: boolean;
  onGo: () => void;
}) {
  const bundle = units.find((u) => u.unit.unit_id === target.unitId)!;
  const lesson = bundle.lessons.find((l) => l.lesson_id === target.lessonId)!;
  const record = records.find((r) => r.lessonId === lesson.lesson_id);
  const done = record?.stepsDone ?? [];
  const current = resumeStep(lesson.steps, record);
  const label =
    target.kind === 'done'
      ? t('units.allDone')
      : target.kind === 'start'
        ? t('units.startWith', { unit: unitLabel(bundle.unit), title: bundle.unit.title_vi })
        : `${target.kind === 'next' ? t('home.nextLesson') : t('units.continue')} · ${unitLabel(bundle.unit)} · ${bundle.unit.title_vi}`;
  return (
    <section
      aria-labelledby="home-continue"
      data-testid="home-continue"
      data-kind={target.kind}
      data-topic={color}
      className="flex items-center gap-5 rounded-xl bg-topic-subtle p-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-sm font-semibold text-topic">{label}</p>
        {target.kind !== 'done' && (
          <h2 id="home-continue" className="text-xl font-semibold">
            {t('home.lessonTitle', { n: lesson.order, title: lesson.title_vi })}
          </h2>
        )}
        {target.kind === 'done' && (
          <h2 id="home-continue" className="sr-only">
            {t('units.continue')}
          </h2>
        )}
        {target.kind !== 'done' && lesson.steps.length > 0 && (
          <>
            <p className="flex flex-wrap gap-x-2 text-sm">
              {lesson.steps.map((s, i) => (
                <span key={s} className={cn(s === current && 'font-semibold')}>
                  {i > 0 && (
                    <span aria-hidden className="mr-2 text-muted-foreground">
                      ·
                    </span>
                  )}
                  {t(`lesson.step.${s}`)}
                  {done.includes(s) && <span aria-label="✓"> ✓</span>}
                </span>
              ))}
            </p>
            <div className="flex items-center gap-3">
              <div
                role="progressbar"
                aria-label={t('home.stepsLabel')}
                aria-valuemin={0}
                aria-valuemax={lesson.steps.length}
                aria-valuenow={done.length}
                className="h-1.5 w-40 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className="h-full rounded-full bg-topic"
                  style={{ width: `${(done.length / lesson.steps.length) * 100}%` }}
                />
              </div>
              <span className="text-sm tabular-nums">
                {t('home.steps', { x: done.length, y: lesson.steps.length })}
              </span>
            </div>
          </>
        )}
        <Button
          data-testid="home-continue-button"
          variant={primary ? 'default' : 'outline'}
          size={primary ? 'lg' : 'default'}
          className="self-start"
          aria-keyshortcuts={primary ? 'Enter H' : 'H'}
          onClick={onGo}
        >
          {target.kind === 'continue'
            ? t('units.continue')
            : target.kind === 'done'
              ? t('home.reviewFirst', { unit: unitLabel(units[0]!.unit) })
              : t('units.start')}
          <kbd aria-hidden className="rounded bg-muted px-1.5 font-sans text-xs text-foreground">
            {primary ? '↵' : 'H'}
          </kbd>
        </Button>
      </div>
      <TopicTile
        unit={bundle.unit}
        color={color}
        size="lg"
        className="bg-surface/60 max-tablet:hidden"
      />
    </section>
  );
}

/** Lộ trình gọn (P-10, SCR-03 §D): một hàng chấm mỗi nhánh, nhãn cấp độ, "Bạn đang ở đây". */
function PathStrip({
  units,
  records,
  target,
}: {
  units: UnitBundle[];
  records: LessonProgressRecord[];
  target: ContinueTarget | null;
}) {
  const rows = (['theme', 'grammar'] as const)
    .map((kind) => ({ kind, list: units.filter((u) => u.unit.kind === kind) }))
    .filter((r) => r.list.length > 0);
  return (
    <section
      aria-labelledby="home-path"
      data-testid="home-path"
      className="flex flex-col gap-4 rounded-xl border bg-surface p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h2 id="home-path" className="text-lg font-semibold">
          {t('home.path')}
        </h2>
        <Link to="/units" className="text-sm text-primary underline-offset-4 hover:underline">
          {t('home.seePath')} ›
        </Link>
      </div>
      {rows.map(({ kind, list }) => {
        const doneCount = list.filter((u) => unitStatus(u.lessons, records) === 'completed').length;
        const firstOfLevel = new Map<string, string>();
        for (const u of list) {
          if (u.unit.level && !firstOfLevel.has(u.unit.level))
            firstOfLevel.set(u.unit.level, u.unit.unit_id);
        }
        const levelAt = new Map([...firstOfLevel].map(([level, id]) => [id, level]));
        return (
          <div key={kind} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {kind === 'theme' ? t('units.filterTheme') : t('units.filterGrammar')}
              </span>
              <span className="text-muted-foreground" data-testid={`home-path-${kind}-count`}>
                {t(kind === 'theme' ? 'home.lessonsDone' : 'home.topicsDone', {
                  x: doneCount,
                  y: list.length,
                })}
              </span>
            </div>
            <ol className="flex flex-wrap items-start gap-1.5">
              {list.map((u) => {
                const status = unitStatus(u.lessons, records);
                const progress = unitLessonProgress(u.lessons, records);
                const here = target?.unitId === u.unit.unit_id;
                const name = `${unitLabel(u.unit)} · ${u.unit.title_vi} — ${
                  status === 'completed'
                    ? t('units.done')
                    : status === 'in-progress'
                      ? t('units.inProgress', { x: progress.completed, y: progress.total })
                      : t('units.notStarted')
                }`;
                return (
                  <li key={u.unit.unit_id} className="flex w-7 flex-col items-center gap-0.5">
                    <span
                      className="h-4 text-[10px] font-bold text-muted-foreground"
                      data-testid={`home-path-level-${u.unit.unit_id}`}
                    >
                      {levelAt.get(u.unit.unit_id) ?? ''}
                    </span>
                    <Link
                      to={`/units/${u.unit.unit_id}`}
                      aria-label={name}
                      title={name}
                      aria-current={here ? 'step' : undefined}
                      data-testid={`home-path-${u.unit.unit_id}`}
                      data-status={status}
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full border-2 text-[11px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        status === 'completed' &&
                          'border-mastery-mastered bg-mastery-mastered text-primary-foreground',
                        status === 'in-progress' &&
                          'border-primary bg-mastery-known text-foreground',
                        status === 'not-started' && 'border-border-strong bg-surface',
                        here && 'ring-2 ring-primary ring-offset-2',
                      )}
                    >
                      <span aria-hidden>
                        {status === 'completed' ? '✓' : status === 'in-progress' ? '◐' : ''}
                      </span>
                    </Link>
                    {here && (
                      <span aria-hidden className="text-[10px] leading-tight text-primary">
                        ▲
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {list.some((u) => u.unit.unit_id === target?.unitId) && (
              <p className="text-xs text-primary">
                {t('home.here', {
                  unit: unitLabel(list.find((u) => u.unit.unit_id === target!.unitId)!.unit),
                })}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** Tóm tắt nhanh (P-08, SCR-03 §E): 4 ô số, mỗi ô là link. */
function Summary({ data }: { data: PracticeData }) {
  const of = (type: 'word' | 'sentence') => data.cards.filter((c) => c.itemType === type);
  const ids = (type: 'word' | 'sentence') => [...new Set(of(type).map((c) => c.itemId))];
  const words = countMastery(ids('word'), of('word'));
  const sentences = countMastery(ids('sentence'), of('sentence'));
  const lessonsTotal = data.bundles.reduce((n, b) => n + b.lessons.length, 0);
  const lessonsDone = data.lessons.filter((l) => l.completedAt).length;
  const review = data.needsReview.length;
  const tiles = [
    {
      to: '/words',
      testId: 'home-sum-words',
      label: t('home.sumWords'),
      value: `${words.mastered}/${words.total}`,
      sub: t('home.sumWordsSub', { n: words.known + words.learning }),
    },
    {
      to: '/progress#cau',
      testId: 'home-sum-sentences',
      label: t('home.sumSentences'),
      value: String(sentences.total),
      sub: t('home.sumSentencesSub', { n: sentences.mastered }),
    },
    {
      to: '/units',
      testId: 'home-sum-lessons',
      label: t('home.sumLessons'),
      value: `${lessonsDone}/${lessonsTotal}`,
      sub: null,
    },
    {
      to: '/words?level=review',
      testId: 'home-sum-review',
      label: t('home.sumReview'),
      value: review ? t('home.items', { n: review }) : t('home.none'),
      sub: review ? t('home.sumReviewSub') : null,
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.testId}>
            <Link
              to={tile.to}
              data-testid={tile.testId}
              className="flex h-full flex-col gap-1 rounded-xl border bg-surface p-4 shadow-card outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-sm text-muted-foreground">{tile.label}</span>
              <span className="text-2xl font-bold tabular-nums">{tile.value}</span>
              {tile.sub && <span className="text-xs text-muted-foreground">{tile.sub}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/progress"
        className="self-end text-sm text-primary underline-offset-4 hover:underline"
      >
        {t('home.seeProgress')} ›
      </Link>
    </div>
  );
}
