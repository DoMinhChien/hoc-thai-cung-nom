import type { GameSource, SourceSpec, UnitBundle } from '@nom/core';
import { unitLabel } from '@/content/labels';
import { t } from '@/i18n';

/** Liệt kê tối đa ngần này bài trên nút "Nội dung ôn"; còn lại gộp "và n mục khác". */
const LABEL_MAX = 3;

export const countLabel = (source: Pick<GameSource, 'words' | 'sentences'>) =>
  t('games.sourceCount', { words: source.words.length, sentences: source.sentences.length });

/** Tên nội dung trên nút "Nội dung ôn", vd. "Bài 9, Bài 10" / "Bài 1 · gồm mục chưa học". */
export function sourceLabel(spec: SourceSpec, bundles: readonly UnitBundle[]): string {
  if (spec.kind !== 'units' && spec.kind !== 'lessons') return t(`games.quick.${spec.kind}`);
  const names = spec.ids.flatMap((id) => {
    if (spec.kind === 'units') {
      const b = bundles.find((x) => x.unit.unit_id === id);
      return b ? [unitLabel(b.unit)] : [];
    }
    for (const b of bundles) {
      const lesson = b.lessons.find((l) => l.lesson_id === id);
      if (lesson) return [t('games.lessonItem', { unit: unitLabel(b.unit), n: lesson.order })];
    }
    return [];
  });
  const list =
    names.length > LABEL_MAX
      ? t('games.sourceMore', {
          list: names.slice(0, LABEL_MAX).join(', '),
          n: names.length - LABEL_MAX,
        })
      : names.join(', ');
  return spec.includeNew ? t('games.sourceNew', { label: list }) : list;
}
