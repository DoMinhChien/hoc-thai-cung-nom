import { gradeThaiTyping, type TypingResult } from '@nom/core';
import { useId, useState } from 'react';
import { ThaiTextInput, TypingFeedback } from '@/components/typing';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

/**
 * Dữ liệu GIẢ LẬP để xem ô gõ + bàn phím ảo (M8) — câu `s-u02-002` của content mẫu (draft),
 * KHÔNG phải bài tập thật. Bài tập E-07 dùng các component này ở M9.
 */
const SAMPLE = { vi: 'Tôi có một anh trai.', accepted: ['ผมมีพี่ชายหนึ่งคน'] };

export function TypingDemoPage() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<TypingResult | null>(null);
  const hintId = useId();

  const check = () => setResult(gradeThaiTyping(value, SAMPLE.accepted));

  return (
    <div data-testid="page-dev-typing" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('pages.devTyping')}</h1>
        <p className="text-muted-foreground">{t('devTyping.intro')}</p>
      </header>

      <section className="flex flex-col gap-4 border-t pt-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('devTyping.prompt')}</p>
          <p className="text-xl font-medium" data-testid="typing-prompt">
            {SAMPLE.vi}
          </p>
        </div>
        <ThaiTextInput
          value={value}
          onChange={(v) => {
            setValue(v);
            setResult(null);
          }}
          onSubmit={check}
          aria-label={t('devTyping.inputLabel')}
          aria-describedby={hintId}
        />
        <p id={hintId} className="text-sm text-muted-foreground">
          {t('devTyping.hint')}
        </p>
        <Button className="self-start" onClick={check} data-testid="typing-check">
          {t('devTyping.check')}
        </Button>
        {result && <TypingFeedback result={result} />}
      </section>
    </div>
  );
}
