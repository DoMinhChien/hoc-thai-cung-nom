import { z } from 'zod';
import { AudioSchema, IdSchema, ImageSchema, LevelSchema, TextSchema, ThaiTextSchema } from '../schema/common';
import { UnitKindSchema } from '../schema/course';
import { DialogueSchema, GrammarSchema } from '../schema/grammar';

/**
 * Định dạng JSON do `content:build` sinh ra (`apps/web/public/content/`, plan 0.7, 0.11) — dùng chung
 * cho script build và web (T7.1). Schema ở đây đọc JSON đã build (danh sách là mảng, `order` là số),
 * khác schema CSV trong `../schema` (ô chuỗi). Kiểu trùng với kiểu schema CSV (test kiểm tra).
 */

export const UNITS_FILE = 'units.json';
export const MANIFEST_FILE = 'manifest.json';
export const unitFile = (unitId: string) => `unit-${unitId}.json`;

const OrderSchema = z.number().int().positive();

/** Bước của bài học (plan 0.4), chỉ gồm bước có dữ liệu (0.11 #3). */
export const LessonStepSchema = z.enum(['vocab', 'grammar', 'dialogue', 'exercise']);
export type LessonStep = z.infer<typeof LessonStepSchema>;

export const UnitJsonSchema = z.object({
  unit_id: IdSchema,
  level: LevelSchema.optional(),
  kind: UnitKindSchema,
  order: OrderSchema,
  title_vi: TextSchema,
  title_th: ThaiTextSchema.optional(),
  can_do: z.array(TextSchema),
  draft: z.boolean(),
});

export const BuiltLessonSchema = z.object({
  lesson_id: IdSchema,
  unit_id: IdSchema,
  order: OrderSchema,
  title_vi: TextSchema,
  grammar_ids: z.array(IdSchema),
  draft: z.boolean(),
  steps: z.array(LessonStepSchema),
});
export type BuiltLesson = z.output<typeof BuiltLessonSchema>;

export const WordJsonSchema = z.object({
  id: IdSchema,
  unit_id: IdSchema,
  lesson_id: IdSchema,
  thai: ThaiTextSchema,
  thai_alt: z.array(ThaiTextSchema),
  meaning_vi: z.array(TextSchema),
  note_vi: z.string().optional(),
  classifier: ThaiTextSchema.optional(),
  pos: z.string().optional(),
  phonetic: z.string().optional(),
  example_th: ThaiTextSchema.optional(),
  example_vi: z.string().optional(),
  image: ImageSchema.optional(),
  tags: z.array(z.string()),
  source: z.string().optional(),
  draft: z.boolean(),
});

/** Câu sau build: `tokens` luôn có khi có `th`; `auto_tokens` = do build tự tách, cần duyệt. */
export const BuiltSentenceSchema = z.object({
  id: IdSchema,
  unit_id: IdSchema,
  lesson_id: IdSchema,
  vi: TextSchema,
  th: ThaiTextSchema.optional(),
  th_alt: z.array(ThaiTextSchema),
  tokens: z.array(ThaiTextSchema),
  distractors: z.array(ThaiTextSchema),
  grammar_id: IdSchema.optional(),
  audio: AudioSchema.optional(),
  source: z.string().optional(),
  draft: z.boolean(),
  auto_tokens: z.literal(true).optional(),
});
export type BuiltSentence = z.output<typeof BuiltSentenceSchema>;

/** `unit-<id>.json`: mọi thứ của một unit — tải khi mở unit. */
export const UnitBundleSchema = z.object({
  unit: UnitJsonSchema,
  lessons: z.array(BuiltLessonSchema),
  words: z.array(WordJsonSchema),
  sentences: z.array(BuiltSentenceSchema),
  grammar: z.array(GrammarSchema),
  dialogues: z.array(DialogueSchema),
});
export type UnitBundle = z.output<typeof UnitBundleSchema>;

const CountSchema = z.number().int().nonnegative();

export const LessonSummarySchema = BuiltLessonSchema.extend({
  words: CountSchema,
  sentences: CountSchema,
});
export type LessonSummary = z.output<typeof LessonSummarySchema>;

/** Một phần tử `units.json` (lộ trình `/units`, P-10). */
export const UnitSummarySchema = UnitJsonSchema.extend({
  lessons: z.array(LessonSummarySchema),
  words: CountSchema,
  sentences: CountSchema,
});
export type UnitSummary = z.output<typeof UnitSummarySchema>;

export const UnitsFileSchema = z.array(UnitSummarySchema);

export const ManifestEntrySchema = z.object({
  /** sha256 (16 ký tự hex đầu) của nội dung file — dùng để cache/so phiên bản. */
  hash: z.string().regex(/^[0-9a-f]{16}$/),
  /** Số unit (units.json) hoặc số mục (unit-*.json). */
  count: CountSchema,
});
export type ManifestEntry = z.output<typeof ManifestEntrySchema>;

export const ManifestSchema = z.object({
  /** Hash gộp của mọi file — đổi khi bất kỳ nội dung nào đổi. */
  version: z.string().regex(/^[0-9a-f]{16}$/),
  files: z.record(z.string(), ManifestEntrySchema),
});
export type Manifest = z.output<typeof ManifestSchema>;
