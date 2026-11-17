import { z } from 'zod';
import { draftCell, optionalCell, optionalListCell, orderCell, listCell } from './csv';
import { IdSchema, LevelSchema, TextSchema, ThaiTextSchema } from './common';

/** Một dòng `content/units.csv` (plan 0.3, 0.9): chủ đề A1/A2, `can_do` ngăn bằng `|`. */
export const UnitSchema = z.strictObject({
  unit_id: IdSchema,
  level: LevelSchema,
  order: orderCell,
  title_vi: TextSchema,
  title_th: optionalCell.pipe(ThaiTextSchema.optional()),
  can_do: listCell('|').pipe(z.array(TextSchema).min(1, 'cần ít nhất 1 mục can-do')),
  draft: draftCell,
});
export type Unit = z.output<typeof UnitSchema>;

/** Một dòng `content/lessons.csv` (plan 0.4, 0.9): `grammar_ids` ngăn bằng `|`. */
export const LessonSchema = z.strictObject({
  lesson_id: IdSchema,
  unit_id: IdSchema,
  order: orderCell,
  title_vi: TextSchema,
  grammar_ids: optionalListCell('|').pipe(z.array(IdSchema)),
  draft: draftCell,
});
export type Lesson = z.output<typeof LessonSchema>;
