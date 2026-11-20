import {
  gradeAttempt,
  gradeMatchItem,
  questionItems,
  recordPracticeAnswer,
  type PracticeQuestion,
} from '@nom/core';
import { CheckCircle2, CircleAlert, X, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFeedbackSound, useKeyShortcut } from '@/components/interactive';
import { TypingFeedback } from '@/components/typing';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRepositories } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { expectedLang, expectedOf } from './answers';
import { QuestionView, type Answered } from './QuestionView';

/** Một câu sai của phiên (màn kết quả SCR-06 §C). */
export interface WrongAnswer {
  question: PracticeQuestion['question'];
  result: Answered;
}

export interface PracticeSummary {
  /** Số câu hỏi của lượt đầu. */
  total: number;
  /** Câu đúng ở lần trả lời đầu ("Hard" tính đúng). */
  correct: number;
  durationMs: number;
  wrong: WrongAnswer[];
}

export interface PracticeRunnerProps {
  questions: PracticeQuestion[];
  /** Có giọng Thái. */
  voice: boolean;
  /** Dừng giữa chừng (đã xác nhận). Không có → nhúng trong bài học: không nút Thoát / Esc riêng. */
  onExit?: () => void;
  onFinish: (summary: PracticeSummary) => void;
  /** Đồng hồ (test). */
  now?: () => Date;
}

/**
 * Phiên làm bài (SCR-06 §B): câu hỏi lần lượt, thanh tiến độ, Bỏ qua `S`, phản hồi + Tiếp `Enter`;
 * câu sai hỏi lại 1 lần ở cuối phiên (không chấm FSRS lần 2). Lần trả lời đầu ghi FSRS ngay.
 */
export function PracticeRunner({
  questions,
  voice,
  onExit,
  onFinish,
  now = () => new Date(),
}: PracticeRunnerProps) {
  const repos = useRepositories();
  const sound = useFeedbackSound();
  const startedAt = useRef(now());
  // Ghi tuần tự (không tạo thẻ trùng); kết quả phiên chỉ hiện khi đã ghi xong.
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  // Hàng câu hỏi: lượt đầu, rồi câu sai được thêm vào cuối (retry: true).
  const [queue, setQueue] = useState(() => questions.map((q) => ({ ...q, retry: false })));
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<WrongAnswer[]>([]);
  const [stopping, setStopping] = useState(false);

  const current = queue[index];
  const firstRound = questions.length;

  const record = (result: Answered) => {
    if (!current || !repos) return;
    const at = now();
    const { question, unitId } = current;
    for (const item of questionItems(question)) {
      const mistakes = result.mistakes?.[item.itemId] ?? 0;
      const rating = current.retry
        ? null
        : question.kind === 'match'
          ? gradeMatchItem(mistakes)
          : gradeAttempt({
              correct: result.correct,
              tone: result.tone,
              ...(result.hinted ? { hinted: true } : {}),
              ...(result.skipped ? { skipped: true } : {}),
            });
      const entry = {
        exerciseType: question.type,
        item,
        unitId,
        correct: question.kind === 'match' ? mistakes === 0 : result.correct,
        rating,
        ...(result.given === undefined ? {} : { answer: result.given }),
      };
      writes.current = writes.current
        .then(() => recordPracticeAnswer(repos, entry, at))
        .catch(() => {});
    }
  };

  const answer = (result: Answered) => {
    if (!current || answered) return;
    const ok = result.correct && !result.skipped;
    setAnswered(result);
    record(result);
    if (ok) sound.play(true);
    if (current.retry) return;
    if (ok) setCorrect((n) => n + 1);
    else {
      setWrong((w) => [...w, { question: current.question, result }]);
      setQueue((q) => [...q, { ...current, retry: true }]);
    }
  };
  const skip = () =>
    current &&
    answer({
      correct: false,
      tone: false,
      skipped: true,
      expected: expectedOf(current.question),
    });

  const next = () => {
    if (!answered) return;
    setAnswered(null);
    if (index + 1 < queue.length) setIndex(index + 1);
    else {
      const summary = {
        total: firstRound,
        correct,
        durationMs: now().getTime() - startedAt.current.getTime(),
        wrong,
      };
      void writes.current.then(() => onFinish(summary));
    }
  };

  useKeyShortcut('Enter', next, !!answered && !stopping);
  useKeyShortcut(['s', 'S'], skip, !answered && !stopping);
  useKeyShortcut('Escape', () => setStopping(true), !stopping && !!onExit);

  if (!current) return null;
  const done = Math.min(index + (answered ? 1 : 0), firstRound);
  return (
    <div className="flex flex-col gap-6" data-testid="practice-session">
      <header className="flex items-center gap-4">
        {onExit && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="practice-exit"
            aria-keyshortcuts="Escape"
            onClick={() => setStopping(true)}
          >
            <X aria-hidden />
            {t('practice.exit')}
            <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
              Esc
            </kbd>
          </Button>
        )}
        <div
          role="progressbar"
          aria-label={t('practice.progressLabel')}
          aria-valuemin={0}
          aria-valuemax={firstRound}
          aria-valuenow={done}
          className="h-1 flex-1 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full bg-primary motion-safe:transition-[width]"
            style={{ width: `${(done / firstRound) * 100}%` }}
          />
        </div>
        <span className="text-sm tabular-nums" data-testid="practice-count">
          {t('practice.count', { n: Math.min(index + 1, firstRound), total: firstRound })}
        </span>
        <span
          className="flex items-center gap-1 text-sm text-positive tabular-nums"
          data-testid="practice-correct"
          aria-label={t('practice.correctCount', { n: correct })}
        >
          <CheckCircle2 className="size-4" aria-hidden /> {correct}
        </span>
      </header>

      {current.retry && (
        <p className="text-sm text-muted-foreground" data-testid="practice-retry">
          {t('practice.retryRound')}
        </p>
      )}

      <section className="rounded-xl border p-6">
        <QuestionView
          key={index}
          question={current.question}
          answered={answered}
          onAnswer={answer}
          voice={voice}
        />
      </section>

      {answered ? (
        <Feedback result={answered} lang={expectedLang(current.question)} onNext={next} />
      ) : (
        <div>
          <Button variant="ghost" data-testid="practice-skip" aria-keyshortcuts="S" onClick={skip}>
            {t('practice.skip')} <kbd className="font-sans text-xs text-muted-foreground">S</kbd>
          </Button>
        </div>
      )}

      <AlertDialog open={stopping} onOpenChange={setStopping}>
        <AlertDialogContent data-testid="practice-stop-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('practice.stopTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('practice.stopBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('practice.stopContinue')}</AlertDialogCancel>
            <AlertDialogAction data-testid="practice-stop-confirm" onClick={onExit}>
              {t('practice.stopConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Thanh phản hồi đáy (SCR-06 §B): icon + chữ; sai → đáp án; gõ → diff. */
function Feedback({
  result,
  lang,
  onNext,
}: {
  result: Answered;
  lang: 'th' | 'vi';
  onNext: () => void;
}) {
  const ok = result.correct && !result.skipped;
  const Icon = result.tone ? CircleAlert : ok ? CheckCircle2 : XCircle;
  return (
    <div
      role="status"
      data-testid="feedback-bar"
      data-correct={ok}
      data-tone={result.tone}
      className={cn(
        'flex flex-col gap-3 rounded-lg border-l-4 px-4 py-3 motion-safe:animate-enter',
        result.tone
          ? 'border-caution bg-caution-subtle'
          : ok
            ? 'border-positive bg-positive-subtle'
            : 'border-destructive bg-destructive-subtle',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Icon
          aria-hidden
          className={cn(
            'size-6 shrink-0',
            result.tone ? 'text-caution' : ok ? 'text-positive' : 'text-destructive',
          )}
        />
        <p className="font-semibold">
          {result.tone ? t('practice.tone') : ok ? t('practice.correct') : t('practice.wrong')}
          {!ok && result.expected && (
            <>
              {' · '}
              <span className="font-normal">{t('practice.answerLabel')} </span>
              <span
                lang={lang}
                className={cn('font-normal', lang === 'th' && 'text-th-sm')}
                data-testid="feedback-answer"
              >
                {result.expected}
              </span>
            </>
          )}
        </p>
        <Button
          className="ml-auto"
          data-testid="practice-next"
          aria-keyshortcuts="Enter"
          onClick={onNext}
        >
          {t('practice.next')} ↵
        </Button>
      </div>
      {result.typing && result.typing.verdict !== 'correct' && (
        <TypingFeedback result={result.typing} />
      )}
    </div>
  );
}
