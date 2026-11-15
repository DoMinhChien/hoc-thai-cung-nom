import { z } from 'zod';

/** 5 thanh tiếng Thái (A-03). */
export const ToneSchema = z.enum(['mid', 'low', 'falling', 'high', 'rising']);
export type Tone = z.infer<typeof ToneSchema>;

/** 4 dấu thanh: ่ ek · ้ tho · ๊ tri · ๋ chattawa. */
export const ToneMarkSchema = z.enum(['ek', 'tho', 'tri', 'chattawa']);
export type ToneMark = z.infer<typeof ToneMarkSchema>;

/** Lớp phụ âm (plan 6.1). */
export const ConsonantClassSchema = z.enum(['mid', 'high', 'low']);
export type ConsonantClass = z.infer<typeof ConsonantClassSchema>;

export const VowelLengthSchema = z.enum(['short', 'long']);
export type VowelLength = z.infer<typeof VowelLengthSchema>;

/** Âm cuối theo cách phát âm: vang (m n ng y w) hoặc tắc (k t p) — plan 6.2. */
export const FinalSoundSchema = z.enum(['m', 'n', 'ng', 'y', 'w', 'k', 't', 'p']);
export type FinalSound = z.infer<typeof FinalSoundSchema>;

/** id duy nhất, ascii kebab, vd. `ko-kai`, `bai-01`. */
export const IdSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id phải là ascii kebab-case (a-z, 0-9, -)');

/** Hình minh họa: emoji Noto (`noto:1f414`, `noto:1f1fb-1f1f3`) hoặc file (`img/…`). */
export const ImageSchema = z
  .string()
  .regex(
    /^(noto:[0-9a-f]{4,6}(-[0-9a-f]{4,6})*|img\/[a-z0-9][a-z0-9/_-]*\.(svg|png|webp|jpg))$/,
    'image phải dạng noto:<mã hex> hoặc img/<tên>.svg|png|webp|jpg',
  );

/** Chuỗi tiếng Việt/Thái bắt buộc, không rỗng. */
export const TextSchema = z.string().trim().min(1, 'không được để trống');

/** Phụ âm Thái đơn: ก (U+0E01) … ฮ (U+0E2E). */
export const ThaiConsonantCharSchema = z.string().regex(/^[ก-ฮ]$/, 'phải là đúng 1 phụ âm Thái');

/** Chữ Thái có thể kèm `|` (ranh giới từ/âm tiết do owner đặt). */
export const ThaiTextSchema = z
  .string()
  .trim()
  .min(1)
  // Chuỗi `\u` thay vì `\p{Script=Thai}`: JSON Schema xuất ra phải chạy được với `re` của Python (M4).
  .regex(new RegExp('[\\u0E00-\\u0E7F]'), 'phải chứa chữ Thái');

/** Trường dùng chung cho mọi mục nội dung (V-07, AGENTS.md mục 4). */
export const contentMeta = {
  image: ImageSchema.optional(),
  mnemonic_vi: TextSchema.optional(),
  source: TextSchema.optional(),
  /** `true` = dữ liệu mẫu/chưa được owner duyệt. */
  draft: z.boolean().default(false),
};
