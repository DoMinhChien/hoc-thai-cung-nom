import { z } from 'zod';
import { contentMeta, IdSchema, TextSchema, ThaiTextSchema, ToneSchema } from './common';

/** `content/listening/minimal-pairs.yaml` — D-02: 2–4 từ chỉ khác thanh. */
export const MinimalPairSchema = z
  .strictObject({
    id: IdSchema,
    words: z
      .array(
        z.strictObject({
          thai: ThaiTextSchema,
          tone: ToneSchema,
          phonetic: z.string().optional(),
          meaning_vi: TextSchema.optional(),
        }),
      )
      .min(2)
      .max(4),
    ...contentMeta,
  })
  .check((ctx) => {
    const tones = ctx.value.words.map((w) => w.tone);
    if (new Set(tones).size !== tones.length) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value,
        path: ['words'],
        message: 'các từ trong cặp tối thiểu phải khác thanh',
      });
    }
  });
export type MinimalPair = z.output<typeof MinimalPairSchema>;
