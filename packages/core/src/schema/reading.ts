import { z } from 'zod';
import { contentMeta, IdSchema, TextSchema, ThaiTextSchema } from './common';

/** `content/readings/*.yaml` — C-01, C-02 (`|` override ranh giới từ). */
export const ReadingSchema = z.strictObject({
  id: IdSchema,
  title_vi: TextSchema,
  level: z.int().min(1).max(5),
  sentences: z
    .array(
      z.strictObject({
        th: ThaiTextSchema,
        vi: TextSchema,
      }),
    )
    .min(1),
  ...contentMeta,
});
export type Reading = z.output<typeof ReadingSchema>;
