import { z } from 'zod';
import { IdSchema, TextSchema, ThaiTextSchema } from './common';

const ThaiLineSchema = z.strictObject({ th: ThaiTextSchema, vi: TextSchema });

/** `content/grammar.yaml` (plan 0.4 bước 2, 0.9): mẫu câu + giải thích tiếng Việt + ví dụ. */
export const GrammarSchema = z.strictObject({
  id: IdSchema,
  unit_id: IdSchema,
  title_vi: TextSchema,
  pattern: TextSchema,
  explain_vi: TextSchema,
  examples: z.array(ThaiLineSchema).min(1, 'cần ít nhất 1 ví dụ'),
  source: TextSchema.optional(),
  draft: z.boolean().default(false),
});
export type Grammar = z.output<typeof GrammarSchema>;

/** `content/dialogues.yaml` (plan 0.4 bước 3, 0.9): hội thoại của một bài. */
export const DialogueSchema = z.strictObject({
  id: IdSchema,
  lesson_id: IdSchema,
  lines: z
    .array(z.strictObject({ speaker: TextSchema, ...ThaiLineSchema.shape }))
    .min(1, 'cần ít nhất 1 câu thoại'),
  source: TextSchema.optional(),
  draft: z.boolean().default(false),
});
export type Dialogue = z.output<typeof DialogueSchema>;
