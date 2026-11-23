import {
  compareUnits,
  MIN_SOURCE_ITEMS,
  QUICK_SOURCES,
  resolveGameSource,
  sourceSize,
  topicColors,
  type LearnerSnapshot,
  type QuickSource,
  type ScopeCount,
  type SourceSpec,
  type UnitBundle,
} from '@nom/core';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { BottomSheet } from '@/components/layout/BottomSheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { unitLabel } from '@/content/labels';
import { t } from '@/i18n';
import { useBreakpoint } from '@/lib/useBreakpoint';
import { cn } from '@/lib/utils';
import { countLabel } from './source-label';

/** Lựa chọn trong bộ chọn: một chip ôn nhanh, hoặc tập bài học (+ gồm mục chưa học). */
type Draft = { quick: QuickSource } | { quick: null; lessons: Set<string>; includeNew: boolean };

function toDraft(spec: SourceSpec, bundles: readonly UnitBundle[]): Draft {
  if (spec.kind !== 'units' && spec.kind !== 'lessons') return { quick: spec.kind };
  const ids = new Set(spec.ids);
  const lessons = bundles.flatMap((b) =>
    b.lessons
      .filter((l) => (spec.kind === 'units' ? ids.has(b.unit.unit_id) : ids.has(l.lesson_id)))
      .map((l) => l.lesson_id),
  );
  return { quick: null, lessons: new Set(lessons), includeNew: spec.includeNew };
}

/** Bài chọn trọn → `units:`; có bài chọn một phần → `lessons:` (SCR-08 v3 §4). */
function toSpec(draft: Draft, units: readonly UnitBundle[]): SourceSpec {
  if (draft.quick) return { kind: draft.quick };
  const full = units.filter(
    (b) => b.lessons.length > 0 && b.lessons.every((l) => draft.lessons.has(l.lesson_id)),
  );
  const partial = units.some(
    (b) => !full.includes(b) && b.lessons.some((l) => draft.lessons.has(l.lesson_id)),
  );
  return partial
    ? {
        kind: 'lessons',
        ids: units.flatMap((b) =>
          b.lessons.filter((l) => draft.lessons.has(l.lesson_id)).map((l) => l.lesson_id),
        ),
        includeNew: draft.includeNew,
      }
    : { kind: 'units', ids: full.map((b) => b.unit.unit_id), includeNew: draft.includeNew };
}

const EMPTY: ScopeCount = { words: 0, sentences: 0, learnedWords: 0, learnedSentences: 0 };

/**
 * Bộ chọn nội dung ôn (SCR-08 v3 §2): A. Ôn nhanh (chip có số mục, < 6 mờ + lý do); B. chọn nhiều
 * bài / bài học theo lộ trình, lọc chỉ mục đã học. Desktop: dialog; phone / tablet: bottom sheet.
 */
export function SourcePicker({
  open,
  onOpenChange,
  spec,
  bundles,
  learner,
  counts,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spec: SourceSpec;
  bundles: readonly UnitBundle[];
  learner: LearnerSnapshot;
  counts: Map<string, ScopeCount>;
  onApply: (spec: SourceSpec) => void;
}) {
  const compact = useBreakpoint() !== 'desktop';
  const body = open && (
    <PickerBody
      spec={spec}
      bundles={bundles}
      learner={learner}
      counts={counts}
      onApply={(next) => {
        onApply(next);
        onOpenChange(false);
      }}
    />
  );
  if (compact) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('games.picker.title')}
        testId="source-picker"
        className="h-[92dvh] max-h-[92dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden pb-0"
      >
        {body}
      </BottomSheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="source-picker"
        aria-describedby={undefined}
        className="grid max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-0 pt-5 sm:max-w-2xl"
      >
        <DialogTitle className="px-6 text-xl">{t('games.picker.title')}</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  spec,
  bundles,
  learner,
  counts,
  onApply,
}: {
  spec: SourceSpec;
  bundles: readonly UnitBundle[];
  learner: LearnerSnapshot;
  counts: Map<string, ScopeCount>;
  onApply: (spec: SourceSpec) => void;
}) {
  const units = useMemo(() => [...bundles].sort((a, b) => compareUnits(a.unit, b.unit)), [bundles]);
  const colors = useMemo(() => topicColors(units.map((b) => b.unit)), [units]);
  const [draft, setDraft] = useState<Draft>(() => toDraft(spec, units));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const quickSizes = useMemo(
    () =>
      new Map(
        QUICK_SOURCES.map((q) => [q, sourceSize(resolveGameSource(units, { kind: q }, learner))]),
      ),
    [units, learner],
  );
  const nextSpec = toSpec(draft, units);
  const preview = resolveGameSource(units, nextSpec, learner);
  const enough = sourceSize(preview) >= MIN_SOURCE_ITEMS;
  const lessons = draft.quick ? new Set<string>() : draft.lessons;
  const includeNew = draft.quick ? false : draft.includeNew;

  const pick = (update: (lessons: Set<string>) => void) =>
    setDraft((d) => {
      const next = new Set(d.quick ? [] : d.lessons);
      update(next);
      return { quick: null, lessons: next, includeNew: d.quick ? false : d.includeNew };
    });
  const toggleUnit = (b: UnitBundle, on: boolean) =>
    pick((s) => b.lessons.forEach((l) => (on ? s.add(l.lesson_id) : s.delete(l.lesson_id))));
  const toggleLesson = (id: string, on: boolean) => pick((s) => (on ? s.add(id) : s.delete(id)));
  const learnedOf = (id: string) => {
    const c = counts.get(id) ?? EMPTY;
    return c.learnedWords + c.learnedSentences;
  };

  const group = (kind: 'theme' | 'grammar', title: string) => {
    const list = units.filter((b) => b.unit.kind === kind);
    if (list.length === 0) return null;
    return (
      <details open className="group/g" data-testid={`picker-group-${kind}`}>
        <summary className="flex cursor-pointer list-none items-center gap-1 py-1 text-sm font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronRight
            className="size-4 transition-transform group-open/g:rotate-90"
            aria-hidden
          />
          {title}
        </summary>
        <ul className="flex flex-col">
          {list.map((b) => {
            const id = b.unit.unit_id;
            const c = counts.get(id) ?? EMPTY;
            const chosen = b.lessons.filter((l) => lessons.has(l.lesson_id)).length;
            const isOpen = expanded.has(id);
            const label = unitLabel(b.unit);
            return (
              <li key={id} data-topic={colors.get(id)} className="border-b last:border-b-0">
                <div className="flex items-center gap-2 py-1.5">
                  <label className="flex min-h-11 flex-1 items-center gap-3 lg:min-h-9">
                    <input
                      type="checkbox"
                      data-testid={`picker-unit-${id}`}
                      className="size-4 shrink-0 accent-primary"
                      checked={b.lessons.length > 0 && chosen === b.lessons.length}
                      ref={(el) => {
                        if (el) el.indeterminate = chosen > 0 && chosen < b.lessons.length;
                      }}
                      onChange={(e) => toggleUnit(b, e.target.checked)}
                    />
                    <span aria-hidden className="h-6 w-1 shrink-0 rounded-full bg-topic" />
                    <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
                      <span className="truncate font-medium">
                        {t('games.picker.unitRow', { unit: label, title: b.unit.title_vi })}
                      </span>
                      <span
                        className="text-xs text-muted-foreground tabular-nums lg:ml-auto"
                        data-testid={`picker-count-${id}`}
                      >
                        {t('games.picker.counts', {
                          lw: c.learnedWords,
                          w: c.words,
                          ls: c.learnedSentences,
                          s: c.sentences,
                        })}
                      </span>
                    </span>
                  </label>
                  {b.lessons.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-label={t(isOpen ? 'games.picker.collapse' : 'games.picker.expand', {
                        unit: label,
                      })}
                      data-testid={`picker-expand-${id}`}
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (isOpen) next.delete(id);
                          else next.add(id);
                          return next;
                        })
                      }
                      className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring lg:size-9"
                    >
                      <ChevronRight
                        className={cn('size-4 transition-transform', isOpen && 'rotate-90')}
                        aria-hidden
                      />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <ul className="mb-2 ml-7 flex flex-col border-l pl-3">
                    {[...b.lessons]
                      .sort((x, y) => x.order - y.order)
                      .map((l) => {
                        const lc = counts.get(l.lesson_id) ?? EMPTY;
                        return (
                          <li key={l.lesson_id}>
                            <label className="flex min-h-11 items-center gap-3 text-sm lg:min-h-8">
                              <input
                                type="checkbox"
                                data-testid={`picker-lesson-${l.lesson_id}`}
                                className="size-4 shrink-0 accent-primary"
                                checked={lessons.has(l.lesson_id)}
                                onChange={(e) => toggleLesson(l.lesson_id, e.target.checked)}
                              />
                              <span className="min-w-0 flex-1 truncate">
                                {t('games.picker.lessonRow', { n: l.order, title: l.title_vi })}
                              </span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {t('games.picker.counts', {
                                  lw: lc.learnedWords,
                                  w: lc.words,
                                  ls: lc.learnedSentences,
                                  s: lc.sentences,
                                })}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    );
  };

  return (
    <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-1 pb-4 lg:px-6">
        <Section title={t('games.picker.quick')}>
          <div
            role="radiogroup"
            aria-label={t('games.picker.quick')}
            className="grid grid-cols-2 gap-2 tablet:grid-cols-4"
          >
            {QUICK_SOURCES.map((q) => {
              const n = quickSizes.get(q) ?? 0;
              const few = n < MIN_SOURCE_ITEMS;
              return (
                <button
                  key={q}
                  type="button"
                  role="radio"
                  aria-checked={draft.quick === q}
                  data-testid={`picker-quick-${q}`}
                  onClick={() => setDraft({ quick: q })}
                  className={cn(
                    'flex min-h-11 flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    draft.quick === q
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'bg-surface',
                    few && draft.quick !== q && 'opacity-60',
                  )}
                >
                  <span className="font-medium">
                    {t(`games.quick.${q}`)} <span className="tabular-nums">{n}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {few
                      ? t('games.quickTooFew', { min: MIN_SOURCE_ITEMS })
                      : t(`games.quickHint.${q}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t('games.picker.byUnit')}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid="picker-select-learned"
              className="max-lg:min-h-11"
              onClick={() =>
                pick((s) => {
                  s.clear();
                  for (const b of units) {
                    if (learnedOf(b.unit.unit_id) > 0) b.lessons.forEach((l) => s.add(l.lesson_id));
                  }
                })
              }
            >
              {t('games.picker.selectLearned')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="picker-clear"
              className="max-lg:min-h-11"
              onClick={() => pick((s) => s.clear())}
            >
              {t('games.picker.clear')}
            </Button>
          </div>
          {group('theme', t('games.picker.book'))}
          {group('grammar', t('games.picker.topics'))}
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm text-muted-foreground">
              {t('games.picker.filter')}
            </legend>
            {([false, true] as const).map((on) => (
              <label key={String(on)} className="flex min-h-11 items-center gap-3 lg:min-h-8">
                <input
                  type="radio"
                  name="picker-new"
                  data-testid={on ? 'picker-include-new' : 'picker-only-learned'}
                  className="size-4 accent-primary"
                  checked={!draft.quick && includeNew === on}
                  onChange={() =>
                    setDraft((d) => ({
                      quick: null,
                      lessons: d.quick ? new Set() : d.lessons,
                      includeNew: on,
                    }))
                  }
                />
                {t(on ? 'games.picker.includeNew' : 'games.picker.onlyLearned')}
              </label>
            ))}
          </fieldset>
        </Section>
      </div>

      <footer className="sticky bottom-0 flex flex-col gap-2 border-t bg-surface px-1 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-row lg:items-center lg:px-6 lg:pb-5">
        <div className="flex flex-col">
          <span className="font-medium tabular-nums" data-testid="picker-total">
            {t('games.picker.total', { count: countLabel(preview) })}
          </span>
          {!enough && (
            <span className="text-sm text-muted-foreground" data-testid="picker-short">
              {t('games.sourceShort', { min: MIN_SOURCE_ITEMS })}
            </span>
          )}
        </div>
        <Button
          data-testid="picker-apply"
          disabled={!enough}
          className="max-lg:h-12 lg:ml-auto"
          onClick={() => onApply(nextSpec)}
        >
          {t('games.picker.apply')}
        </Button>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
