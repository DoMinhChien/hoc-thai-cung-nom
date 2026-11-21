import { z } from 'zod';
import { draftCell, listCell, optionalCell, optionalListCell, orderCell } from './csv';
import { EmojiSchema, IdSchema, LevelSchema, TextSchema, ThaiTextSchema } from './common';

/** Loại unit (plan 0.11 #2): từ vựng theo chủ đề hoặc điểm ngữ pháp / cách dùng. */
export const UnitKindSchema = z.enum(['theme', 'grammar']);
export type UnitKind = z.infer<typeof UnitKindSchema>;

/**
 * Một dòng `content/units.csv` (plan 0.9, 0.11): chuyên đề của giáo viên, `can_do` ngăn bằng `|`.
 * `level` tùy chọn (A1/A2/B1); `kind` trống = `theme`; `emoji` tùy chọn (M0.5c Q3 — cột có thể vắng,
 * trống → emoji mặc định theo nhánh, `unitEmoji`).
 */
export const UnitSchema = z.strictObject({
  unit_id: IdSchema,
  level: optionalCell.pipe(LevelSchema.optional()),
  kind: optionalCell.pipe(UnitKindSchema.optional()).transform((v) => v ?? 'theme'),
  order: orderCell,
  title_vi: TextSchema,
  title_th: optionalCell.pipe(ThaiTextSchema.optional()),
  can_do: listCell('|').pipe(z.array(TextSchema).min(1, 'cần ít nhất 1 mục can-do')),
  emoji: optionalCell.pipe(EmojiSchema.optional()),
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
