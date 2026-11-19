import type { UnitKind } from '@nom/core';
import { t } from '@/i18n';

/** Nhãn unit theo nhánh lộ trình (plan 0.12 #1): Giáo trình "Bài {order}", Chuyên đề "Chuyên đề {order}". */
export function unitLabel(unit: { kind: UnitKind; order: number }): string {
  return t(unit.kind === 'grammar' ? 'units.topicN' : 'units.bookN', { n: unit.order });
}
