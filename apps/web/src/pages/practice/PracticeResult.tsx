import type { Question } from '@nom/core';
import { Burst, Emoji } from '@/components/fun';
import { useCompletionSound, useKeyShortcut } from '@/components/interactive';
import { TypingFeedback } from '@/components/typing';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { SpeakButton } from '../units/parts';
import type { PracticeSummary } from './PracticeRunner';
import { expectedLang } from './answers';

/** Đề của câu hỏi để nhắc lại ở danh sách câu sai. */
function promptOf(q: Question): { text: string; lang: 'th' | 'vi' } {
  switch (q.kind) {
    case 'choice':
    case 'typing':
      return q.prompt.vi
        ? { text: q.prompt.vi, lang: 'vi' }
        : { text: q.prompt.th ?? ('audio' in q ? (q.audio ?? '') : ''), lang: 'th' };
    case 'arrange':
      return { text: q.vi, lang: 'vi' };
    case 'match':
      return { text: q.pairs.map((p) => `${p.left} — ${p.right}`).join(' · '), lang: q.lang.left };
  }
}

export interface PracticeResultProps {
  summary: PracticeSummary;
  onRetryWrong: () => void;
  onBack: () => void;
  onMore: () => void;
  /** Dòng thêm khi nhúng trong bài học (SCR-05: hoàn thành ≥ 80%). */
  extra?: React.ReactNode;
}

/** Kết quả phiên (SCR-06 §C): % đúng, x/y, thời gian; câu sai + đáp án; hành động tiếp. */
export function PracticeResult({
  summary,
  onRetryWrong,
  onBack,
  onMore,
  extra,
}: PracticeResultProps) {
  const { total, correct, durationMs, wrong } = summary;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.max(1, Math.round(durationMs / 60_000));
  const hasWrong = wrong.length > 0;
  useCompletionSound();
  useKeyShortcut('Enter', hasWrong ? onRetryWrong : onBack);

  return (
    <section className="flex flex-col gap-8" data-testid="practice-result">
      <div className="flex items-center gap-5">
        <span className="relative flex size-24 shrink-0 items-center justify-center rounded-full bg-positive-subtle text-positive motion-safe:animate-fb-complete">
          <Emoji size="lg">{pct >= 80 ? '🌟' : '🎯'}</Emoji>
          <Burst />
        </span>
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">
          {t('practice.doneTitle')}
        </h1>
      </div>
      <dl className="flex flex-wrap gap-12">
        {[
          [`${pct}%`, t('practice.resultPct'), 'result-pct'],
          [t('practice.resultCount', { correct, total }), '', 'result-count'],
          [t('practice.minutes', { n: minutes }), t('practice.resultTime'), 'result-time'],
        ].map(([value, label, id]) => (
          <div key={id} className="flex flex-col">
            <dd className="order-1 text-[32px] font-bold tabular-nums" data-testid={id}>
              {value}
            </dd>
            {label && <dt className="order-2 text-sm text-muted-foreground">{label}</dt>}
          </div>
        ))}
      </dl>
      {extra}
      {hasWrong ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('practice.wrongList', { n: wrong.length })}</h2>
          <ul className="flex flex-col gap-3" data-testid="practice-wrong-list">
            {wrong.map(({ question, result }, i) => {
              const lang = expectedLang(question);
              return (
                <li key={i} className="flex flex-col gap-1 rounded-lg border p-4">
                  {result.expected && (
                    <p className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('practice.expected')}
                      </span>
                      <span lang={lang} className={cn(lang === 'th' && 'text-th-md')}>
                        {result.expected}
                      </span>
                      {lang === 'th' && <SpeakButton text={result.expected} />}
                    </p>
                  )}
                  {result.typing ? (
                    <TypingFeedback result={result.typing} />
                  ) : (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('practice.yourAnswer')} </span>
                      {result.given ? (
                        <span lang={lang}>{result.given}</span>
                      ) : (
                        t('practice.skipped')
                      )}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t('practice.promptLabel')}{' '}
                    <span lang={promptOf(question).lang}>{promptOf(question).text}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="font-medium text-positive" data-testid="practice-no-wrong">
          {t('practice.noWrong')}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {hasWrong && (
          <Button
            data-testid="practice-retry-wrong"
            aria-keyshortcuts="Enter"
            onClick={onRetryWrong}
          >
            {t('practice.retryWrong')} ↵
          </Button>
        )}
        <Button
          variant={hasWrong ? 'outline' : 'default'}
          data-testid="practice-back"
          aria-keyshortcuts={hasWrong ? undefined : 'Enter'}
          onClick={onBack}
        >
          {t('practice.backPractice')}
          {!hasWrong && ' ↵'}
        </Button>
        <Button variant="outline" data-testid="practice-more" onClick={onMore}>
          {t('practice.moreTen')}
        </Button>
      </div>
    </section>
  );
}
