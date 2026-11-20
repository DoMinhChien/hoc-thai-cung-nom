import {
  completeLessonStep,
  resumeStep,
  unitStatus,
  type BuiltLesson,
  type LessonStep,
  type UnitBundle,
} from '@nom/core';
import { Check, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { useCompletionSound, useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnit } from '@/content/hooks';
import { unitLabel } from '@/content/labels';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { Badge, LoadError } from './parts';
import { DialogueStep } from './steps/DialogueStep';
import { ExerciseStep } from './steps/ExerciseStep';
import { GrammarStep } from './steps/GrammarStep';
import { VocabStep } from './steps/VocabStep';

/** Banner "chưa có giọng Thái" chỉ hiện 1 lần mỗi phiên (SCR-05). */
let voiceBannerShown = false;

/** `/units/:unitId/:lessonId` — bài học theo `lesson.steps` (SCR-05, Focus layout). */
export function LessonPage() {
  const { unitId = '', lessonId = '' } = useParams();
  const content = useUnit(unitId);
  const records = useRepositoryQuery((r) => r.progress.listLessonProgress(unitId), [unitId]);
  const lesson =
    content.status === 'ready'
      ? content.data.lessons.find((l) => l.lesson_id === lessonId)
      : undefined;

  let body;
  if (content.status === 'loading' || records === undefined) body = <Skeleton className="h-96" />;
  else if (content.status === 'error' && content.error.kind !== 'not-found')
    body = <LoadError kind={content.error.kind} />;
  else if (content.status !== 'ready' || !lesson)
    body = (
      <div className="flex flex-col items-start gap-3">
        <p>{t('lesson.notFound')}</p>
        <Link
          to={content.status === 'ready' ? `/units/${unitId}` : '/units'}
          className="text-primary hover:underline"
        >
          {t('lesson.backUnit')}
        </Link>
      </div>
    );
  else
    body = (
      <Lesson
        key={lesson.lesson_id}
        bundle={content.data}
        lesson={lesson}
        done={records.find((r) => r.lessonId === lesson.lesson_id)?.stepsDone ?? []}
        initial={resumeStep(
          lesson.steps,
          records.find((r) => r.lessonId === lesson.lesson_id),
        )}
      />
    );
  return <section data-testid="page-lesson">{body}</section>;
}

function Lesson({
  bundle,
  lesson,
  done,
  initial,
}: {
  bundle: UnitBundle;
  lesson: BuiltLesson;
  done: LessonStep[];
  initial: LessonStep | undefined;
}) {
  const navigate = useNavigate();
  const repos = useRepositories();
  const [step, setStep] = useState<LessonStep | 'finished' | undefined>(initial);
  const exit = () => navigate(`/units/${bundle.unit.unit_id}`);
  const steps = lesson.steps;
  const index = typeof step === 'string' ? steps.indexOf(step as LessonStep) : -1;

  useKeyShortcut('Escape', exit);
  useKeyShortcut(['[', ']'], (e) => {
    const next = index + (e.key === ']' ? 1 : -1);
    if (next >= 0 && next < steps.length) setStep(steps[next]);
  });

  /** Ghi xong bước rồi sang bước sau (hoặc màn hoàn thành). Bài tập < 80% thì ở lại. */
  const finishStep = async (current: LessonStep, score?: number) => {
    if (repos) await completeLessonStep(repos.progress, lesson, current, new Date(), score);
    if (current === 'exercise' && (score ?? 0) < 0.8) return;
    const next = steps[steps.indexOf(current) + 1];
    setStep(next ?? 'finished');
  };

  const nextLabel = (current: LessonStep) => {
    const next = steps[steps.indexOf(current) + 1];
    return next ? t('lesson.next', { step: t(`lesson.step.${next}`) }) : t('lesson.finish');
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b pb-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={exit}
            aria-keyshortcuts="Escape"
            data-testid="lesson-exit"
          >
            <X aria-hidden />
            {t('lesson.exit')}
            <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
              Esc
            </kbd>
          </Button>
          <h1 className="font-semibold">
            {t('lesson.title', {
              unit: unitLabel(bundle.unit),
              lesson: lesson.order,
              title: lesson.title_vi,
            })}
          </h1>
          {lesson.draft && <Badge muted>{t('units.draft')}</Badge>}
        </div>
        <ol aria-label={t('lesson.stepper')} className="flex flex-wrap items-center gap-2 text-sm">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="h-px w-6 bg-border-strong" />}
              <button
                type="button"
                data-testid={`step-${s}`}
                aria-current={step === s ? 'step' : undefined}
                onClick={() => setStep(s)}
                className={cn(
                  'flex items-center gap-1 rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  step === s
                    ? 'border-b-2 border-primary font-medium text-primary'
                    : 'text-muted-foreground',
                )}
              >
                {i + 1}. {t(`lesson.step.${s}`)}
                {done.includes(s) && <Check className="size-3.5 text-positive" aria-label="✓" />}
              </button>
            </li>
          ))}
          <li aria-hidden className="ml-auto text-xs text-muted-foreground">
            [ ]
          </li>
        </ol>
      </header>
      <VoiceBanner />
      <div className="mx-auto w-full max-w-[720px]">
        {step === undefined ? (
          <p className="text-muted-foreground">{t('lesson.noSteps')}</p>
        ) : step === 'finished' ? (
          <Finished bundle={bundle} lesson={lesson} />
        ) : step === 'vocab' ? (
          <VocabStep
            key="vocab"
            bundle={bundle}
            lesson={lesson}
            nextLabel={nextLabel('vocab')}
            onDone={() => void finishStep('vocab')}
          />
        ) : step === 'grammar' ? (
          <GrammarStep
            key="grammar"
            bundle={bundle}
            lesson={lesson}
            nextLabel={nextLabel('grammar')}
            onDone={() => void finishStep('grammar')}
          />
        ) : step === 'dialogue' ? (
          <DialogueStep
            key="dialogue"
            bundle={bundle}
            lesson={lesson}
            nextLabel={nextLabel('dialogue')}
            onDone={() => void finishStep('dialogue')}
          />
        ) : (
          <ExerciseStep
            key="exercise"
            bundle={bundle}
            lesson={lesson}
            onScore={(score) => finishStep('exercise', score)}
            onLater={exit}
          />
        )}
      </div>
    </div>
  );
}

function VoiceBanner() {
  const status = useVoiceStatus();
  const [show] = useState(() => !voiceBannerShown);
  const visible = show && (status === 'missing' || status === 'unsupported');
  useEffect(() => {
    if (visible) voiceBannerShown = true;
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg bg-caution-subtle px-4 py-2 text-sm"
    >
      <TriangleAlert className="size-4 shrink-0 text-caution" aria-hidden />
      <span className="flex-1">{t('lesson.noVoice')}</span>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm">
            {t('lesson.howTo')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lesson.howTo')}</DialogTitle>
            <DialogDescription>{t('lesson.howToBody')}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Màn hoàn thành bài (SCR-05): 3 số + dòng xong chuyên đề; không confetti. */
function Finished({ bundle, lesson }: { bundle: UnitBundle; lesson: BuiltLesson }) {
  const navigate = useNavigate();
  useCompletionSound();
  const records = useRepositoryQuery(
    (r) => r.progress.listLessonProgress(bundle.unit.unit_id),
    [bundle.unit.unit_id],
  );
  const record = records?.find((r) => r.lessonId === lesson.lesson_id);
  const nextLesson = bundle.lessons.find((l) => l.order > lesson.order);
  const unitDone = records !== undefined && unitStatus(bundle.lessons, records) === 'completed';
  const go = () =>
    navigate(
      nextLesson
        ? `/units/${bundle.unit.unit_id}/${nextLesson.lesson_id}`
        : `/units/${bundle.unit.unit_id}`,
    );
  useKeyShortcut('Enter', go);
  const words = bundle.words.filter((w) => w.lesson_id === lesson.lesson_id).length;
  const sentences = bundle.sentences.filter((s) => s.lesson_id === lesson.lesson_id).length;
  return (
    <div data-testid="lesson-finished" className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">
        {t('lesson.doneTitle', { n: lesson.order, title: lesson.title_vi })}
      </h2>
      <dl className="flex flex-wrap gap-10">
        {[
          [words, t('lesson.statWords')],
          [sentences, t('lesson.statSentences')],
          [
            record?.bestScore === null || record === undefined
              ? '—'
              : `${Math.round(record.bestScore * 100)}%`,
            t('lesson.statScore'),
          ],
        ].map(([value, label]) => (
          <div key={String(label)} className="flex flex-col">
            <dd className="order-1 text-4xl font-semibold text-primary tabular-nums">{value}</dd>
            <dt className="order-2 text-sm text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>
      {unitDone && (
        <div className="flex flex-col gap-1" data-testid="unit-complete">
          <p className="font-medium text-positive">
            {t('lesson.unitComplete', {
              unit: unitLabel(bundle.unit),
              title: bundle.unit.title_vi,
            })}
          </p>
          <ul className="text-sm text-muted-foreground">
            {bundle.unit.can_do.map((c) => (
              <li key={c}>☑ {c}</li>
            ))}
          </ul>
        </div>
      )}
      <Button
        className="self-start"
        data-testid="lesson-next"
        aria-keyshortcuts="Enter"
        onClick={go}
      >
        {nextLesson ? t('lesson.nextLesson') : t('lesson.backUnit')}
        <kbd aria-hidden className="rounded bg-primary-foreground/20 px-1.5 font-sans text-xs">
          ↵
        </kbd>
      </Button>
    </div>
  );
}
