import { z } from 'zod';
import { draftCell, listCell, optionalCell, optionalListCell } from './csv';
import { AudioSchema, IdSchema, TextSchema, ThaiTextSchema } from './common';

/**
 * Một dòng `content/sentences.csv` (plan 0.5, 0.9). Ô danh sách ngăn bằng `|`:
 * `th_alt` bản dịch chấp nhận khác (E-07), `tokens` tách từ cho E-06, `distractors` thẻ nhiễu (bậc 3).
 * Ràng buộc chéo (`tokens` ghép = `th`…) ở `content:check`.
 */
export const SentenceSchema = z.strictObject({
  id: IdSchema,
  unit_id: IdSchema,
  lesson_id: IdSchema,
  vi: TextSchema,
  th: ThaiTextSchema,
  th_alt: optionalListCell('|').pipe(z.array(ThaiTextSchema)),
  tokens: listCell('|').pipe(z.array(ThaiTextSchema).min(1, 'cần tách từ (ngăn bằng |)')),
  distractors: optionalListCell('|').pipe(z.array(ThaiTextSchema)),
  grammar_id: optionalCell.pipe(IdSchema.optional()),
  audio: optionalCell.pipe(AudioSchema.optional()),
  source: optionalCell,
  draft: draftCell,
});
export type Sentence = z.output<typeof SentenceSchema>;
