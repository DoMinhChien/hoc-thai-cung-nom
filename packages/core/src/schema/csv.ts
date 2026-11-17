import { z } from 'zod';

/**
 * Ô CSV (plan 0.9): mọi ô là chuỗi. Danh sách nhiều mục trong một ô ngăn bằng `|`
 * (`meaning_vi`, `tags` ngăn bằng `;` như M3).
 */
const split = (value: string, sep: string) =>
  value
    .split(sep)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

/** Ô trống / vắng cột → `undefined`. */
export const optionalCell = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()));

/** Ô bắt buộc chứa danh sách ngăn bằng `sep`. */
export const listCell = (sep: string) => z.string().transform((v) => split(v, sep));

/** Ô tùy chọn chứa danh sách ngăn bằng `sep`; trống → `[]`. */
export const optionalListCell = (sep: string) =>
  optionalCell.transform((v) => (v ? split(v, sep) : []));

/** Số thứ tự dương (`order`). */
export const orderCell = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]*$/, 'phải là số nguyên dương (1, 2, 3…)')
  .transform(Number);

/** `draft`: `true` | `false` | trống (= false). */
export const draftCell = z
  .enum(['true', 'false', ''])
  .optional()
  .transform((v) => v === 'true');
