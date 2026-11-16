import type { InherentFinal } from '../schema/common';

/** เ–า (không phải เ–าะ): cho phép cụm 2 phụ âm (เหงา) và dấu thanh trước า. */
const SARA_AO = /เ[ก-ฮ]{1,2}[่-๋]?า(?!ะ)/u;

/**
 * Âm cuối vang có sẵn trong nguyên âm của âm tiết (plan 6.2): ไ– ใ– → `y`, –ำ → `m`, เ–า → `w`;
 * `null` nếu không có. Nhận chữ của **một** âm tiết.
 */
export function inherentFinal(syllable: string): InherentFinal | null {
  if (/[ไใ]/u.test(syllable)) return 'y';
  if (syllable.includes('ำ')) return 'm';
  if (SARA_AO.test(syllable)) return 'w';
  return null;
}
