import { completionPercent, type MasteryCounts } from '@nom/core';
import { MasteryLegend, ProgressRing, StackedProgressBar } from '@/components/progress';
import { t } from '@/i18n';
import type { ReactNode } from 'react';

/** Dữ liệu GIẢ LẬP để xem component progress (M5) — KHÔNG phải nội dung học hay tiến độ thật. */
const LEVEL: MasteryCounts = { none: 40, learning: 30, known: 20, mastered: 14, total: 104 };
const LESSON: MasteryCounts = { none: 2, learning: 1, known: 1, mastered: 1, total: 5 };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t pt-4">
      <h2 className="font-mono text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ProgressDemoPage() {
  return (
    <div data-testid="page-dev-progress" className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('pages.devProgress')}</h1>
        <p className="text-muted-foreground">{t('devProgress.intro')}</p>
        <MasteryLegend />
      </header>

      <Section title={t('devProgress.ring')}>
        <div className="flex items-center gap-6">
          <ProgressRing percent={completionPercent(LEVEL)} label={t('devProgress.sampleLevel')} />
          <ProgressRing percent={0} label={t('devProgress.sampleLesson')} size={48} />
          <ProgressRing percent={100} label={t('devProgress.sampleLesson')} size={96} />
        </div>
      </Section>

      <Section title={t('devProgress.stacked')}>
        <StackedProgressBar counts={LEVEL} label={t('devProgress.sampleLevel')} />
        <StackedProgressBar counts={LESSON} label={t('devProgress.sampleLesson')} />
      </Section>
    </div>
  );
}
