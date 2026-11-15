import { z } from 'zod';
import { contentMeta, IdSchema, TextSchema, ThaiTextSchema, ToneSchema } from './common';

/** Ô CSV trống → `undefined`. */
const optionalCell = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()));

const split = (value: string, sep: string) =>
  value
    .split(sep)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

/** Tách ô CSV theo `sep`, bỏ khoảng trắng thừa. */
const splitCell = (sep: string) => z.string().transform((v) => split(v, sep));

const optionalList = (sep: string) => optionalCell.transform((v) => (v ? split(v, sep) : []));

/**
 * Một dòng `content/vocab/words.csv` (plan 5.5, B-02). Mọi ô là chuỗi;
 * `syllables`/`tones` ngăn bằng `|`, `meaning_vi`/`tags` ngăn bằng `;`.
 */
export const WordRowSchema = z
  .strictObject({
    id: IdSchema,
    thai: ThaiTextSchema,
    phonetic: z
      .string()
      .regex(/^[a-z]+([- ][a-z]+)*$/, 'phiên âm: chữ Latin thường, không dấu, ngăn bằng -'),
    syllables: splitCell('|').pipe(z.array(ThaiTextSchema).min(1)),
    tones: splitCell('|').pipe(z.array(ToneSchema).min(1)),
    meaning_vi: splitCell(';').pipe(z.array(TextSchema).min(1, 'cần ít nhất 1 nghĩa')),
    pos: optionalCell,
    deck: IdSchema,
    example_th: optionalCell,
    example_vi: optionalCell,
    tags: optionalList(';'),
    source: optionalCell,
    image: optionalCell.pipe(contentMeta.image),
    mnemonic_vi: optionalCell,
    draft: z
      .enum(['true', 'false', ''])
      .optional()
      .transform((v) => v === 'true'),
  })
  .check((ctx) => {
    const { syllables, tones } = ctx.value;
    if (syllables.length !== tones.length) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value,
        path: ['tones'],
        message: `tones có ${tones.length} mục nhưng syllables có ${syllables.length}`,
      });
    }
  });
export type WordRow = z.output<typeof WordRowSchema>;

/** `content/vocab/decks.yaml` — B-01 (thứ tự do owner định nghĩa). */
export const DeckSchema = z.strictObject({
  id: IdSchema,
  title_vi: TextSchema,
  description_vi: TextSchema.optional(),
  order: z.int().positive(),
  ...contentMeta,
});
export type Deck = z.output<typeof DeckSchema>;
