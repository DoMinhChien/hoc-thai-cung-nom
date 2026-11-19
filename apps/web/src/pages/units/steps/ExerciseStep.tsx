import {
  buildLessonQuiz,
  checkLessonAnswer,
  LESSON_PASS_SCORE,
  type BuiltLesson,
  type LessonQuestion,
  type UnitBundle,
} from '@nom/core';
import { useState } from 'react';
import { ChoiceButton, FeedbackBar, TokenBank, useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/**
 * Bước Bài tập (SCR-05, M7): khung + 2 loại có sẵn (chọn nghĩa, xếp câu) dùng component M7.5.
 * ≥ 80% → hoàn thành bài; < 80% → làm lại câu sai hoặc để sau (vẫn lưu điểm cao nhất).
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
  const [questions, setQuestions] = useState<LessonQuestion[]>(() =>
    buildLessonQuiz(bundle, lesson.lesson_id, randomSeed()),
  );
  const total = useState(() => questions.length)[0];
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Map<string, boolean>>(new Map());
  const [answer, setAnswer] = useState<{ correct: boolean } | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const finished = index >= questions.length;
  const q = questions[index];

  const submit = (value: string | readonly string[]) => {
    if (!q || answer) return;
    const correct = checkLessonAnswer(q, value);
    setAnswer({ correct });
    setResults(new Map(results).set(q.itemId, correct));
  };
  const next = () => {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAnswer(null);
    setPicked([]);
    if (nextIndex >= questions.length) {
      const correct = [...results.values()].filter(Boolean).length;
      void onScore(correct / total);
    }
  };
  useKeyShortcut('Enter', next, !!answer);

  if (finished) {
    const correct = [...results.values()].filter(Boolean).length;
    const score = correct / total;
    return (
      <Result
        correct={correct}
        total={total}
        passed={score >= LESSON_PASS_SCORE}
        onRetry={() => {
          setQuestions(questions.filter((x) => results.get(x.itemId) === false));
          setIndex(0);
        }}
        onLater={onLater}
      />
    );
  }

  const question = q!;
  return (
    <div className="flex flex-col gap-6" data-testid="exercise">
      <p className="text-sm text-muted-foreground">
        {t('lesson.questionOf', { n: index + 1, total: questions.length })} ·{' '}
        {question.kind === 'meaning' ? t('lesson.quizMeaning') : t('lesson.quizArrange')}
      </p>
      {question.kind === 'meaning' ? (
        <>
          <p lang="th" data-testid="exercise-th" className="text-center text-th-lg">
            {question.th}
          </p>
          <div className="grid grid-cols-2 gap-3" data-testid="exercise-options">
            {question.options.map((option, i) => (
              <ChoiceButton
                key={`${index}-${option}`}
                shortcut={String(i + 1)}
                status={
                  !answer
                    ? 'idle'
                    : option === question.expected
                      ? 'correct'
                      : option === chosen
                        ? 'wrong'
                        : 'idle'
                }
                disabled={!!answer}
                onSelect={() => {
                  setChosen(option);
                  submit(option);
                }}
              >
                {option}
              </ChoiceButton>
            ))}
          </div>
        </>
      ) : (
        <>
          <p
            data-testid="exercise-vi"
            className="rounded-xl bg-accent px-5 py-4 text-xl font-medium"
          >
            {question.vi}
          </p>
          <TokenBank
            key={index}
            tokens={question.bank}
            value={picked}
            onChange={setPicked}
            onSubmit={() => submit(picked.map((i) => question.bank[i]!))}
            disabled={!!answer}
          />
          {!answer && (
            <Button
              className="self-start"
              data-testid="exercise-check"
              disabled={picked.length === 0}
              onClick={() => submit(picked.map((i) => question.bank[i]!))}
            >
              {t('lesson.check')} ↵
            </Button>
          )}
        </>
      )}
      {answer && (
        <>
          <FeedbackBar
            correct={answer.correct}
            answer={
              answer.correct
                ? undefined
                : question.kind === 'meaning'
                  ? question.expected
                  : question.th
            }
          />
          <Button
            className="self-start"
            data-testid="exercise-next"
            aria-keyshortcuts="Enter"
            onClick={next}
          >
            {t('lesson.nextQuestion')} ↵
          </Button>
        </>
      )}
    </div>
  );
}

function Result({
  correct,
  total,
  passed,
  onRetry,
  onLater,
}: {
  correct: number;
  total: number;
  passed: boolean;
  onRetry: () => void;
  onLater: () => void;
}) {
  useKeyShortcut('Enter', onRetry, !passed);
  const pct = Math.round((correct / total) * 100);
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
