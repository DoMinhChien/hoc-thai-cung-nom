import { HIGH_CONSONANTS, MID_CONSONANTS } from '../tone/classes';
import { z } from 'zod';
import {
  ConsonantClassSchema,
  contentMeta,
  FinalSoundSchema,
  IdSchema,
  InherentFinalSchema,
  TextSchema,
  ThaiConsonantCharSchema,
  ThaiTextSchema,
  ToneMarkSchema,
  ToneSchema,
  VowelLengthSchema,
} from './common';

/** Phiên âm Latin không dấu (quy ước app), vd. `k`, `kh`, `sa-wat-di`. */
const PhoneticSchema = z
  .string()
  .regex(/^[a-z]+([- ][a-z]+)*$/, 'phiên âm: chữ Latin thường, không dấu, ngăn bằng - hoặc space');

/** `content/alphabet/consonants.yaml` — A-01, V-01. */
export const ConsonantSchema = z.strictObject({
  id: IdSchema,
  char: ThaiConsonantCharSchema,
  /** Tên chữ, vd. `ก ไก่`. */
  name: ThaiTextSchema,
  class: ConsonantClassSchema,
  /** Âm đầu (Latin). */
  initial: PhoneticSchema,
  /** Âm cuối (Latin); `null` nếu chữ không đứng cuối. */
  final: PhoneticSchema.nullable().default(null),
  phonetic: PhoneticSchema,
  keyword_vi: TextSchema,
  order: z.int().positive(),
  ...contentMeta,
});
export type Consonant = z.output<typeof ConsonantSchema>;

/** `content/alphabet/vowels.yaml` — A-02. `form` dùng `–` làm chỗ của phụ âm, vd. `เ–ีย`. */
export const VowelSchema = z.strictObject({
  id: IdSchema,
  form: z.string().regex(/^[^–]*–[^–]*$/, 'form phải có đúng 1 placeholder –'),
  length: VowelLengthSchema,
  /** ไ– ใ– –ำ เ–า: nguyên âm ngắn mang sẵn âm cuối vang → âm tiết sống (plan 6.2). */
  inherent_final: InherentFinalSchema.optional(),
  phonetic: PhoneticSchema,
  order: z.int().positive(),
  ...contentMeta,
});
export type Vowel = z.output<typeof VowelSchema>;

/** `content/alphabet/tone-marks.yaml` — A-03. */
export const ToneMarkEntrySchema = z.strictObject({
  id: ToneMarkSchema,
  char: z.enum(['่', '้', '๊', '๋']),
  /** Tên dấu, vd. `ไม้เอก`. */
  name: ThaiTextSchema,
  order: z.int().positive(),
  ...contentMeta,
});
export type ToneMarkEntry = z.output<typeof ToneMarkEntrySchema>;

/** `content/alphabet/tones.yaml` — A-03, A-04 (ghi chú so sánh với thanh Việt do owner soạn). */
export const ToneEntrySchema = z.strictObject({
  id: ToneSchema,
  label_vi: TextSchema,
  /** Số Chao, vd. `33`, `21`. */
  chao: z.string().regex(/^[1-5]{2,3}$/),
  compare_vi: TextSchema.optional(),
  order: z.int().positive(),
  ...contentMeta,
});
export type ToneEntry = z.output<typeof ToneEntrySchema>;

/** `content/alphabet/tone-drills.yaml` — âm tiết phân tích sẵn cho Tone Trainer (A-20). */
export const SyllableAnalysisSchema = z.strictObject({
  id: IdSchema,
  thai: ThaiTextSchema,
  initial_char: ThaiConsonantCharSchema,
  /**
   * Phụ âm dẫn (อักษรนำ, plan 6.1): mọi phụ âm cao/trung đứng trước phụ âm thấp đơn — gồm cả
   * ห นำ / อ นำ. `null` nếu không có (kể cả từ mượn đọc tách, khi đó dùng `tone_override`).
   */
  leading: z
    .string()
    .regex(
      new RegExp(`^[${MID_CONSONANTS}${HIGH_CONSONANTS}]$`),
      'phụ âm dẫn phải là 1 phụ âm cao hoặc trung',
    )
    .nullable()
    .default(null),
  vowel_length: VowelLengthSchema,
  final_sound: FinalSoundSchema.nullable().default(null),
  tone_mark: ToneMarkSchema.nullable().default(null),
  expected_tone: ToneSchema,
  /** Ngoại lệ đã biết (từ mượn…): tin `expected_tone`, validator không đối chiếu Tone Engine. */
  tone_override: z.boolean().optional(),
  /** Ghi chú cho ngoại lệ, vd. lý do đọc tách. */
  note: TextSchema.optional(),
  ...contentMeta,
});
export type SyllableAnalysis = z.output<typeof SyllableAnalysisSchema>;
