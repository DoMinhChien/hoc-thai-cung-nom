import {
  buildPracticeSession,
  byDifficulty,
  exercisePool,
  LESSON_PASS_SCORE,
  questionItems,
  type BuiltLesson,
  type ExerciseItemRef,
  type PracticeMode,
  type SentenceLevelRecord,
  type UnitBundle,
} from '@nom/core';
import { useState } from 'react';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { PracticeRunner, type PracticeSummary } from '@/pages/practice/PracticeRunner';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/**
 * Bước Bài tập (SCR-05, M9 T9.6): cùng engine với `/practice` — câu hỏi E-01..E-14 của bài, độ khó
 * tăng dần, lần trả lời đầu chấm FSRS (từ/câu của bài vào SRS). ≥ 80% → hoàn thành bài; < 80% → làm
 * lại câu sai hoặc để sau (vẫn lưu điểm cao nhất).
 */
export function ExerciseStep({
  bundle,
  lesson,
  onScore,
  onLater,
}: {
  bundle: UnitBundle;
  lesson: BuiltLesson;
  /** Lưu điểm (0–1); ≥ 80% thì bài chuyển sang màn hoàn thành. */
  onScore: (score: number) => Promise<void>;
  onLater: () => void;
}) {
  const voice = useVoiceStatus();
  const levels = useRepositoryQuery((r) => r.progress.listSentenceLevels(), []);
  const [round, setRound] = useState<{ n: number; items: ExerciseItemRef[] | null }>({
    n: 0,
    items: null,
  });
  if (levels === undefined || voice === 'checking') return <Skeleton className="h-64" />;
  return (
    <Round
      key={round.n}
      bundle={bundle}
      lesson={lesson}
      levels={levels}
      voice={voice === 'available'}
      mode={
        round.items
          ? { kind: 'items', items: round.items }
          : { kind: 'lesson', lessonId: lesson.lesson_id }
      }
      onScore={onScore}
      onLater={onLater}
      onRetry={(items) => setRound({ n: round.n + 1, items })}
    />
  );
}

function Round({
  bundle,
  levels,
  voice,
  mode,
  onScore,
  onLater,
  onRetry,
}: {
  bundle: UnitBundle;
  lesson: BuiltLesson;
  levels: SentenceLevelRecord[];
  voice: boolean;
  mode: PracticeMode;
  onScore: (score: number) => Promise<void>;
  onLater: () => void;
  onRetry: (items: ExerciseItemRef[]) => void;
}) {
  // Dựng một lần cho lượt này (dữ liệu đổi trong lúc làm không xáo lại câu).
  const [questions] = useState(() =>
    byDifficulty(
      buildPracticeSession({
        pool: exercisePool([bundle]),
        cards: [],
        levels,
        needsReview: [],
        attempts: [],
        lessons: [],
        mode,
        voice,
        now: new Date(),
        seed: randomSeed(),
      }),
    ),
  );
  const [summary, setSummary] = useState<PracticeSummary | null>(null);

  if (questions.length === 0) {
    return <p className="text-muted-foreground">{t('practice.empty')}</p>;
  }
  if (summary) {
    return (
      <Result
        summary={summary}
        onRetry={() => onRetry(summary.wrong.flatMap((w) => questionItems(w.question)))}
        onLater={onLater}
      />
    );
  }
  return (
    <PracticeRunner
      questions={questions}
      voice={voice}
      onFinish={(s) => {
        setSummary(s);
        void onScore(s.total ? s.correct / s.total : 0);
      }}
    />
  );
}

function Result({
  summary,
  onRetry,
  onLater,
}: {
  summary: PracticeSummary;
  onRetry: () => void;
  onLater: () => void;
}) {
  const { correct, total } = summary;
  const passed = total > 0 && correct / total >= LESSON_PASS_SCORE;
  useKeyShortcut('Enter', onRetry, !passed);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4" data-testid="exercise-result" data-passed={passed}>
      <p className="text-2xl font-semibold">{t('lesson.score', { correct, total, pct })}</p>
      {passed ? (
        <p className="font-medium text-positive">{t('lesson.passed')}</p>
      ) : (
        <>
          <p className="text-muted-foreground">{t('lesson.need80')}</p>
          <div className="flex gap-3">
            <Button data-testid="exercise-retry" aria-keyshortcuts="Enter" onClick={onRetry}>
              {t('lesson.retryWrong')} ↵
            </Button>
            <Button variant="outline" onClick={onLater}>
              {t('lesson.later')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
