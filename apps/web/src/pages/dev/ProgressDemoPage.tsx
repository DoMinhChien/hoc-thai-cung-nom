import {
  accuracyBy,
  completionPercent,
  MASTERY_LEVELS,
  type Accuracy,
  type MasteryCounts,
  type Tone,
} from '@nom/core';
import {
  HeatmapTable,
  MasteryGrid,
  MasteryLegend,
  ProgressRing,
  StackedProgressBar,
  ToneBarChart,
  type MasteryGridItem,
} from '@/components/progress';
import { t } from '@/i18n';
import type { ReactNode } from 'react';

/**
 * Dữ liệu GIẢ LẬP để xem component progress (M5) — KHÔNG phải nội dung học hay tiến độ thật.
 * 44 phụ âm chỉ là ký tự hiển thị; mức thuộc gán xoay vòng.
 */
const CONSONANTS = [...'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ'];
const GRID: MasteryGridItem[] = CONSONANTS.map((thai, i) => ({
  id: `c${i}`,
  thai,
  level: MASTERY_LEVELS[[3, 3, 2, 1, 0, 2, 0, 0][i % 8]!]!,
}));

const counts = GRID.reduce<MasteryCounts>(
  (acc, item) => ({ ...acc, [item.level]: acc[item.level] + 1, total: acc.total + 1 }),
  { none: 0, learning: 0, known: 0, mastered: 0, total: 0 },
);

const DECK: MasteryCounts = { none: 2, learning: 1, known: 1, mastered: 1, total: 5 };

const acc = (correct: number, total: number): Accuracy => ({
  correct,
  total,
  ratio: total ? correct / total : null,
});

const RULES: Record<string, Accuracy> = {
  'mid:live': acc(18, 20),
  'mid:dead': acc(9, 12),
  'mid:ek': acc(10, 10),
  'mid:tho': acc(7, 9),
  'mid:tri': acc(2, 3),
  'mid:chattawa': acc(0, 0),
  'high:live': acc(12, 15),
  'high:dead': acc(3, 8),
  'high:ek': acc(5, 6),
  'high:tho': acc(4, 7),
  'low:live': acc(14, 14),
  'low:dead-long': acc(4, 10),
  'low:ek': acc(6, 8),
  'low:tho': acc(8, 9),
};

const MARKS = ['ek', 'tho', 'tri', 'chattawa'] as const;
const VALID_MARKS: Record<string, readonly string[]> = {
  mid: MARKS,
  high: ['ek', 'tho'],
  low: ['ek', 'tho'],
};

function ruleFor(row: string, col: string): string | null {
  if (col === 'live') return `${row}:live`;
  if (col === 'dead') return row === 'low' ? 'low:dead-long' : `${row}:dead`;
  return VALID_MARKS[row]!.includes(col) ? `${row}:${col}` : null;
}

const TONE_DATA = accuracyBy<Tone>(
  [
    ...Array.from({ length: 10 }, (_, i) => ({ key: 'mid' as const, correct: i < 9 })),
    ...Array.from({ length: 10 }, (_, i) => ({ key: 'low' as const, correct: i < 6 })),
    ...Array.from({ length: 8 }, (_, i) => ({ key: 'falling' as const, correct: i < 7 })),
    ...Array.from({ length: 9 }, (_, i) => ({ key: 'high' as const, correct: i < 4 })),
  ],
  ['mid', 'low', 'falling', 'high', 'rising'],
);

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
          <ProgressRing percent={completionPercent(counts)} label={t('devProgress.sampleModule')} />
          <ProgressRing percent={0} label={t('devProgress.sampleDeck')} size={48} />
          <ProgressRing percent={100} label={t('devProgress.sampleDeck')} size={96} />
        </div>
      </Section>

      <Section title={t('devProgress.stacked')}>
        <StackedProgressBar counts={counts} label={t('devProgress.sampleModule')} />
        <StackedProgressBar counts={DECK} label={t('devProgress.sampleDeck')} />
      </Section>

      <Section title={t('devProgress.grid')}>
        <MasteryGrid items={GRID} onSelect={() => {}} />
      </Section>

      <Section title={t('devProgress.heatmap')}>
        <HeatmapTable
          caption={t('devProgress.heatmapCaption')}
          rows={[
            { key: 'mid', label: t('devProgress.classMid') },
            { key: 'high', label: t('devProgress.classHigh') },
            { key: 'low', label: t('devProgress.classLow') },
          ]}
          columns={[
            { key: 'live', label: t('devProgress.colLive') },
            { key: 'dead', label: t('devProgress.colDead') },
            ...MARKS.map((m) => ({ key: m, label: t(`devProgress.mark.${m}`) })),
          ]}
          getCell={(row, col) => {
            const rule = ruleFor(row, col);
            return rule ? { rule, accuracy: RULES[rule] ?? acc(0, 0) } : null;
          }}
          onPractice={() => {}}
        />
      </Section>

      <Section title={t('devProgress.toneChart')}>
        <ToneBarChart data={TONE_DATA} />
      </Section>
    </div>
  );
}
