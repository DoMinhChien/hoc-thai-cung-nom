import { z } from 'zod';
import { draftCell, optionalCell, optionalListCell } from './csv';
import { IdSchema, ImageSchema, TextSchema, ThaiTextSchema } from './common';

/**
 * Một dòng `content/words.csv` (plan 0.9, 0.11, B-02). `meaning_vi`/`tags` ngăn bằng `;`, `thai_alt` bằng `|`.
 * v7: không còn `deck`/`syllables`/`tones`; `phonetic` tùy chọn (ẩn mặc định — plan 0.2).
 * v7.1: `thai_alt` (biến thể), `note_vi` (ghi chú dùng), `classifier` (ลักษณนาม);
 * `meaning_vi` được trống khi `draft: true` (tài liệu giáo viên chưa có nghĩa — 0.11 #4).
 */
export const WordSchema = z
  .strictObject({
    id: IdSchema,
    unit_id: IdSchema,
    lesson_id: IdSchema,
    thai: ThaiTextSchema,
    thai_alt: optionalListCell('|').pipe(z.array(ThaiTextSchema)),
    meaning_vi: optionalListCell(';').pipe(z.array(TextSchema)),
    note_vi: optionalCell,
    classifier: optionalCell.pipe(ThaiTextSchema.optional()),
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
    /** Mẹo nhớ gợi ý (V-04, SCR-07 Q1 — cột tùy chọn, có thể vắng). */
    mnemonic_vi: optionalCell,
    tags: optionalListCell(';'),
    source: optionalCell,
    draft: draftCell,
  })
  .check((ctx) => {
    if (!ctx.value.draft && ctx.value.meaning_vi.length === 0) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value,
        path: ['meaning_vi'],
        message: 'cần ít nhất 1 nghĩa (chỉ được trống khi draft: true)',
      });
    }
  });
export type Word = z.output<typeof WordSchema>;
