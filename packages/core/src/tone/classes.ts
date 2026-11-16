import type { ConsonantClass } from '../schema/common';

/** Plan 6.1 — 9 phụ âm trung. */
export const MID_CONSONANTS = 'กจฎฏดตบปอ';
/** Plan 6.1 — 11 phụ âm cao. */
export const HIGH_CONSONANTS = 'ขฃฉฐถผฝศษสห';
/** Plan 6.1 — 24 phụ âm thấp. */
export const LOW_CONSONANTS = 'คฅฆงชซฌญฑฒณทธนพฟภมยรลวฬฮ';

/**
 * Phụ âm thấp đơn (vang) — đứng sau phụ âm cao/trung có อะ ẩn thì tính thanh theo lớp của phụ âm
 * dẫn (อักษรนำ tổng quát, plan 6.1).
 */
export const LEADING_FOLLOWERS = 'งญณนมยรลวฬ';

/** Phụ âm thấp đơn (vang) có thể đứng sau ห นำ: ง ญ น ม ย ร ล ว. */
export const HO_NAM_FOLLOWERS = 'งญนมยรลว';
/** อ นำ chỉ đi với ย (อย่า, อยู่, อย่าง, อยาก). */
export const O_NAM_FOLLOWERS = 'ย';

/** Lớp của một phụ âm; `null` nếu không phải 1 trong 44 phụ âm. */
export function consonantClass(char: string): ConsonantClass | null {
  if ([...char].length !== 1) return null;
  if (MID_CONSONANTS.includes(char)) return 'mid';
  if (HIGH_CONSONANTS.includes(char)) return 'high';
  if (LOW_CONSONANTS.includes(char)) return 'low';
  return null;
}
