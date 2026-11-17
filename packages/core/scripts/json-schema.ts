import { z } from 'zod';
import {
  DialogueSchema,
  GrammarSchema,
  LessonSchema,
  SentenceSchema,
  UnitSchema,
  WordSchema,
} from '../src/schema';

/**
 * Schema xuất ra JSON Schema cho pipeline Python (M4) — tên file ↔ schema Zod.
 * v7 (plan 0.9): đúng 6 file mẫu nhập liệu; schema chữ cái chỉ còn cho Tone Engine đóng băng.
 */
export const EXPORTED_SCHEMAS = {
  unit: UnitSchema,
  lesson: LessonSchema,
  word: WordSchema,
  sentence: SentenceSchema,
  grammar: GrammarSchema,
  dialogue: DialogueSchema,
} as const;

export const JSON_SCHEMA_DIR = new URL('../json-schema/', import.meta.url);

/**
 * Dạng **input** (dữ liệu thô trước khi Zod transform), vd. `word` là các ô CSV dạng chuỗi.
 * Ràng buộc chéo (khóa ngoại, `tokens` ghép = `th`…) chỉ có ở validator TS.
 */
export function buildJsonSchemas(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(EXPORTED_SCHEMAS).map(([name, schema]) => {
      const json = z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12' });
      return [`${name}.schema.json`, `${JSON.stringify({ title: name, ...json }, null, 2)}\n`];
    }),
  );
}
