import { z } from 'zod';
import { draftCell, optionalCell, optionalListCell } from './csv';
import { AudioSchema, IdSchema, TextSchema, ThaiTextSchema } from './common';

/**
 * Một dòng `content/sentences.csv` (plan 0.5, 0.9, 0.11). Ô danh sách ngăn bằng `|`:
 * `th_alt` bản dịch chấp nhận khác (E-07), `tokens` tách từ cho E-06, `distractors` thẻ nhiễu (bậc 3).
 * v7.1: `th` được trống khi `draft: true` (bài tập giáo viên chưa có đáp án — 0.11 #5);
 * `tokens` trống → `content:build` tự tách. Ràng buộc chéo (`tokens` ghép = `th`…) ở `content:check`.
 */
export const SentenceSchema = z
  .strictObject({
    id: IdSchema,
    unit_id: IdSchema,
    lesson_id: IdSchema,
    vi: TextSchema,
    th: optionalCell.pipe(ThaiTextSchema.optional()),
    th_alt: optionalListCell('|').pipe(z.array(ThaiTextSchema)),
    tokens: optionalListCell('|').pipe(z.array(ThaiTextSchema)),
    distractors: optionalListCell('|').pipe(z.array(ThaiTextSchema)),
    grammar_id: optionalCell.pipe(IdSchema.optional()),
    audio: optionalCell.pipe(AudioSchema.optional()),
    source: optionalCell,
    draft: draftCell,
  })
  .check((ctx) => {
    if (!ctx.value.draft && ctx.value.th === undefined) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value,
        path: ['th'],
        message: 'cần bản dịch tiếng Thái (chỉ được trống khi draft: true)',
      });
    }
  });
export type Sentence = z.output<typeof SentenceSchema>;
