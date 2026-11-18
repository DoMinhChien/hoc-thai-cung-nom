import type { DiffPart, TypingResult } from '@nom/core';
import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

const VERDICT = {
  correct: {
    icon: CheckCircle2,
    title: 'typing.correct',
    tone: 'border-positive bg-positive-subtle',
  },
  tone: { icon: CircleAlert, title: 'typing.toneWrong', tone: 'border-caution bg-caution-subtle' },
  wrong: { icon: XCircle, title: 'typing.wrong', tone: 'border-destructive bg-destructive-subtle' },
} as const;

/** Một dòng diff: `del` = phần gõ thừa/sai, `ins` = phần đáp án còn thiếu (không chỉ dựa vào màu). */
function DiffLine({ parts, show }: { parts: DiffPart[]; show: 'extra' | 'missing' }) {
  return (
    <span lang="th" className="text-th-sm">
      {parts.map((part, i) => {
        if (part.kind === 'same') return <span key={i}>{part.text}</span>;
        if (part.kind !== show) return null;
        const Tag = show === 'extra' ? 'del' : 'ins';
        return (
          <Tag
            key={i}
            data-testid={`diff-${show}`}
            className={cn(
              'rounded-sm px-0.5 decoration-2',
              show === 'extra'
                ? 'bg-destructive-subtle text-destructive'
                : 'bg-positive-subtle text-positive',
            )}
          >
            {part.text}
          </Tag>
        );
      })}
    </span>
  );
}

/** Kết quả chấm câu gõ (G-06, E-12): đúng / sai dấu thanh / sai chữ + chỗ sai so với đáp án. */
export function TypingFeedback({ result }: { result: TypingResult }) {
  const { icon: Icon, title, tone } = VERDICT[result.verdict];
  return (
    <div
      role="status"
      data-testid="typing-feedback"
      data-verdict={result.verdict}
      className={cn('flex flex-col gap-2 rounded-lg border-l-4 p-4', tone)}
    >
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="size-5" aria-hidden />
        {t(title)}
      </p>
      {result.verdict !== 'correct' && (
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1">
          <dt className="text-sm text-muted-foreground">{t('typing.yourAnswer')}</dt>
          <dd data-testid="diff-typed">
            <DiffLine parts={result.diff} show="extra" />
          </dd>
          <dt className="text-sm text-muted-foreground">{t('typing.expected')}</dt>
          <dd data-testid="diff-expected">
            <DiffLine parts={result.diff} show="missing" />
          </dd>
        </dl>
      )}
    </div>
  );
}
