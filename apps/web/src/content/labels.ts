import type { UnitKind } from '@nom/core';
import { t } from '@/i18n';

/** Nhãn unit theo nhánh lộ trình (plan 0.12 #1): Giáo trình "Bài {order}", Chuyên đề "Chuyên đề {order}". */
export function unitLabel(unit: { kind: UnitKind; order: number }): string {
  return t(unit.kind === 'grammar' ? 'units.topicN' : 'units.bookN', { n: unit.order });
}

/** Hình minh họa `noto:<codepoint>` (Noto Emoji, D2a) → ký tự emoji; `img/…` hoặc trống → `null`. */
export function imageEmoji(image: string | undefined): string | null {
  const m = image?.match(/^noto:([0-9a-f]+(?:[-_][0-9a-f]+)*)$/i);
  return m ? String.fromCodePoint(...m[1]!.split(/[-_]/).map((h) => parseInt(h, 16))) : null;
}
