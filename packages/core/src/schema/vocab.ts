import { z } from 'zod';
import { draftCell, listCell, optionalCell, optionalListCell } from './csv';
import { IdSchema, ImageSchema, TextSchema, ThaiTextSchema } from './common';

/**
 * Một dòng `content/words.csv` (plan 0.9, B-02). `meaning_vi`/`tags` ngăn bằng `;`.
 * v7: không còn `deck`/`syllables`/`tones`; `phonetic` tùy chọn (ẩn mặc định — plan 0.2).
 */
export const WordSchema = z.strictObject({
  id: IdSchema,
  unit_id: IdSchema,
  lesson_id: IdSchema,
  thai: ThaiTextSchema,
  meaning_vi: listCell(';').pipe(z.array(TextSchema).min(1, 'cần ít nhất 1 nghĩa')),
  pos: optionalCell,
  phonetic: optionalCell.pipe(
    z
      .string()
      .regex(/^[a-z]+([- ][a-z]+)*$/, 'phiên âm: chữ Latin thường, không dấu, ngăn bằng -')
      .optional(),
  ),
  example_th: optionalCell.pipe(ThaiTextSchema.optional()),
  example_vi: optionalCell,
  image: optionalCell.pipe(ImageSchema.optional()),
  tags: optionalListCell(';'),
  source: optionalCell,
  draft: draftCell,
});
export type Word = z.output<typeof WordSchema>;
