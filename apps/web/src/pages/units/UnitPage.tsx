import {
  canDoChecklist,
  lessonStatus,
  setCanDo,
  unitLessonProgress,
  unitStatus,
  type UnitBundle,
} from '@nom/core';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useKeyShortcut } from '@/components/interactive';
import { ProgressRing } from '@/components/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnit } from '@/content/hooks';
import { useMastery, useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { Badge, LoadError, SpeakButton } from './parts';

const VOCAB_PREVIEW = 8;
const MASTERY_DOT = { none: '○', learning: '◐', known: '◐', mastered: '●' } as const;

/** `/units/:unitId` — chi tiết chuyên đề (SCR-04 §B, P-11). */
export function UnitPage() {
  const { unitId = '' } = useParams();
  const content = useUnit(unitId);
  const navigate = useNavigate();
  useKeyShortcut('Escape', () => navigate('/units'));

  return (
    <section data-testid="page-unit" className="flex flex-col gap-6">
      <nav aria-label={t('units.back')} className="text-sm text-muted-foreground">
        <Link to="/units" className="hover:text-foreground hover:underline">
          {t('pages.units')}
        </Link>
        {content.status === 'ready' && <> / {t('units.unitN', { n: content.data.unit.order })}</>}
      </nav>
      {content.status === 'loading' ? (
        <Skeleton className="h-64" />
      ) : content.status === 'error' ? (
        content.error.kind === 'not-found' ? (
          <div className="flex flex-col items-start gap-3">
            <p>{t('units.notFound')}</p>
            <Link to="/units" className="text-primary hover:underline">
              {t('units.back')}
            </Link>
          </div>
        ) : (
          <LoadError kind={content.error.kind} />
        )
      ) : (
        <Detail bundle={content.data} />
      )}
    </section>
  );
}

function Detail({ bundle }: { bundle: UnitBundle }) {
  const { unit, lessons, words } = bundle;
  const navigate = useNavigate();
  const repos = useRepositories();
  const records = useRepositoryQuery(
    (r) => r.progress.listLessonProgress(unit.unit_id),
    [unit.unit_id],
  );
  const ticks = useRepositoryQuery((r) => r.progress.listCanDo(unit.unit_id), [unit.unit_id]);
  const mastery = useMastery(
    'word',
    words.map((w) => w.id),
  );
  const [openWord, setOpenWord] = useState<string | null>(null);

  const recs = records ?? [];
  const status = unitStatus(lessons, recs);
  const progress = unitLessonProgress(lessons, recs);
  const known = mastery ? mastery.counts.mastered : 0;
  const byLesson = new Map(recs.map((r) => [r.lessonId, r]));
  const current =
    lessons.find((l) => lessonStatus(l, byLesson.get(l.lesson_id)) === 'in-progress') ??
    lessons.find((l) => lessonStatus(l, byLesson.get(l.lesson_id)) === 'not-started');
  const primary = () => {
    if (status === 'completed') navigate(`/practice?unit=${unit.unit_id}`);
    else if (current) navigate(`/units/${unit.unit_id}/${current.lesson_id}`);
  };
  useKeyShortcut('Enter', primary, records !== undefined && (status === 'completed' || !!current));
  const goals = canDoChecklist({ can_do: unit.can_do, lessons }, recs, ticks ?? []);

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{unit.title_vi}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {unit.title_th && (
            <span lang="th" className="text-th-sm text-muted-foreground">
              {unit.title_th}
            </span>
          )}
          {unit.level && <Badge>{unit.level}</Badge>}
          <Badge>
            {unit.kind === 'grammar' ? t('units.filterGrammar') : t('units.filterTheme')}
          </Badge>
          {unit.draft && <Badge muted>{t('units.draft')}</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <ProgressRing
            percent={progress.percent}
            label={unit.title_vi}
            size={48}
            className="[&>span]:text-xs"
          />
          <p className="text-sm text-muted-foreground" data-testid="unit-progress">
            {status === 'completed'
              ? t('units.unitDone')
              : t('units.progressLine', {
                  done: progress.completed,
                  total: progress.total,
                  known,
                  words: words.length,
                })}
          </p>
          {(status === 'completed' || current) && (
            <Button
              className="ml-auto"
              data-testid="unit-primary"
              aria-keyshortcuts="Enter"
              onClick={primary}
            >
              {status === 'completed'
                ? t('units.practiceUnit')
                : t('units.continueLesson', { n: current!.order })}
              <kbd
                aria-hidden
                className="rounded bg-primary-foreground/20 px-1.5 font-sans text-xs"
              >
                ↵
              </kbd>
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('units.lessons')}</h2>
          <ul className="divide-y rounded-lg border">
            {lessons.map((lesson) => {
              const record = byLesson.get(lesson.lesson_id);
              const ls = lessonStatus(lesson, record);
              const lessonWords = words.filter((w) => w.lesson_id === lesson.lesson_id).length;
              const lessonSentences = bundle.sentences.filter(
                (s) => s.lesson_id === lesson.lesson_id,
              ).length;
              return (
                <li key={lesson.lesson_id}>
                  <Link
                    to={`/units/${unit.unit_id}/${lesson.lesson_id}`}
                    data-testid={`lesson-row-${lesson.lesson_id}`}
                    data-status={ls}
                    className="flex items-center gap-4 px-4 py-3 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="w-6 text-center font-semibold text-muted-foreground">
                      {lesson.order}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-medium">
                        {lesson.title_vi} {lesson.draft && <Badge muted>{t('units.draft')}</Badge>}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {lesson.steps.map((s) => t(`lesson.step.${s}`)).join(' · ')}
                        {' · '}
                        {t('units.lessonStats', { words: lessonWords, sentences: lessonSentences })}
                      </span>
                    </span>
                    <span className="text-sm">
                      {ls === 'completed'
                        ? t('units.lessonDone', {
                            score: Math.round((record?.bestScore ?? 1) * 100),
                          })
                        : ls === 'in-progress'
                          ? t('units.lessonInProgress', {
                              x: record?.stepsDone.length ?? 0,
                              y: lesson.steps.length,
                            })
                          : t('units.notStarted')}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="flex flex-col gap-6">
          {goals.length > 0 && (
            <section
              className="flex flex-col gap-2 rounded-lg border p-4"
              data-testid="can-do-list"
            >
              <h2 className="font-semibold">{t('units.goals')}</h2>
              <ul className="flex flex-col gap-2">
                {goals.map((g) => (
                  <li key={g.canDo}>
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-primary"
                        checked={g.checked}
                        disabled={g.auto}
                        onChange={(e) =>
                          repos &&
                          void setCanDo(
                            repos.progress,
                            unit.unit_id,
                            g.canDo,
                            e.target.checked,
                            new Date(),
                          )
                        }
                      />
                      <span>
                        {g.canDo}
                        {g.auto && (
                          <span className="block text-xs text-muted-foreground">
                            {t('units.autoTick')}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-2 rounded-lg border p-4" data-testid="unit-vocab">
            <h2 className="font-semibold">{t('units.vocab', { n: words.length })}</h2>
            <ul className="flex flex-col">
              {words.slice(0, VOCAB_PREVIEW).map((w) => {
                const level = mastery?.byItem.get(w.id) ?? 'none';
                const open = openWord === w.id;
                return (
                  <li key={w.id} className="flex flex-col">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenWord(open ? null : w.id)}
                      className="flex items-center gap-2 rounded px-1 py-1 text-left text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden
                        title={t(`progress.level.${level}`)}
                        className={cn(
                          'w-4 text-primary',
                          level === 'none' && 'text-muted-foreground',
                        )}
                      >
                        {MASTERY_DOT[level]}
                      </span>
                      <span className="sr-only">{t(`progress.level.${level}`)}</span>
                      <span lang="th" className="w-24 shrink-0 text-base">
                        {w.thai}
                      </span>
                      <span className="flex-1 truncate">
                        {w.meaning_vi[0] ?? t('units.noMeaning')}
                      </span>
                      {w.classifier && <span lang="th">{w.classifier}</span>}
                    </button>
                    {open && (
                      <div className="ml-6 flex items-start gap-2 rounded bg-secondary p-2 text-sm">
                        <div className="flex-1">
                          <p>{w.meaning_vi.join('; ') || t('units.noMeaning')}</p>
                          {w.note_vi && <p className="text-muted-foreground">{w.note_vi}</p>}
                        </div>
                        <SpeakButton text={w.thai} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link
              to={`/words?unit=${unit.unit_id}`}
              className="text-sm text-primary hover:underline"
            >
              {t('units.seeAll')} ›
            </Link>
          </section>
          <p className="text-xs text-muted-foreground">{t('units.source')}</p>
        </aside>
      </div>
    </>
  );
}
