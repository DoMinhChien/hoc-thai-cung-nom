import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

export interface FeedbackBarProps {
  correct: boolean;
  /** Đáp án đúng (tiếng Thái) — hiện sau "Sai —". */
  answer?: string;
  /** Dòng phụ, vd. nghĩa / điểm cộng. */
  children?: ReactNode;
  className?: string;
}

/** Thanh phản hồi sau mỗi câu: icon + chữ ("✓ Đúng" / "✕ Sai — ตัว"), không chỉ màu. */
export function FeedbackBar({ correct, answer, children, className }: FeedbackBarProps) {
  const Icon = correct ? CheckCircle2 : XCircle;
  return (
    <div
      role="status"
      data-testid="feedback-bar"
      data-correct={correct}
      className={cn(
        'flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 motion-safe:animate-enter',
        correct ? 'border-positive bg-positive-subtle' : 'border-destructive bg-destructive-subtle',
        className,
      )}
    >
      <Icon
        className={cn('size-6 shrink-0', correct ? 'text-positive' : 'text-destructive')}
        aria-hidden
      />
      <p className="font-semibold">
        {correct ? t('play.correct') : t('play.wrong')}
        {!correct && answer && (
          <>
            {' — '}
            <span lang="th" className="text-th-sm font-normal">
              {answer}
            </span>
          </>
        )}
      </p>
      {children && (
        <div
          className={cn(
            'ml-auto text-sm font-semibold',
            correct ? 'text-positive' : 'text-destructive',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
