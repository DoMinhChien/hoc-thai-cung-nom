import { z } from 'zod';
import {
  ConsonantSchema,
  DeckSchema,
  MinimalPairSchema,
  ReadingSchema,
  SyllableAnalysisSchema,
  ToneEntrySchema,
  ToneMarkEntrySchema,
  VowelSchema,
  WordRowSchema,
} from '../src/schema';

/** Schema xuất ra JSON Schema cho pipeline Python (M4) — tên file ↔ schema Zod. */
export const EXPORTED_SCHEMAS = {
  consonant: ConsonantSchema,
  vowel: VowelSchema,
  'tone-mark': ToneMarkEntrySchema,
  tone: ToneEntrySchema,
  'syllable-analysis': SyllableAnalysisSchema,
  'word-row': WordRowSchema,
  deck: DeckSchema,
  reading: ReadingSchema,
  'minimal-pair': MinimalPairSchema,
} as const;

export const JSON_SCHEMA_DIR = new URL('../json-schema/', import.meta.url);

/**
 * Dạng **input** (dữ liệu thô trước khi Zod transform), vd. `word-row` là các ô CSV dạng chuỗi.
 * Ràng buộc chéo trường (độ dài syllables/tones, thanh khác nhau…) chỉ có ở validator TS.
 */
export function buildJsonSchemas(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(EXPORTED_SCHEMAS).map(([name, schema]) => {
      const json = z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12' });
      return [`${name}.schema.json`, `${JSON.stringify({ title: name, ...json }, null, 2)}\n`];
    }),
  );
}
