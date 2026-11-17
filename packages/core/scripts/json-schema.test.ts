import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildJsonSchemas, JSON_SCHEMA_DIR } from './json-schema';

describe('json-schema/ đã commit khớp schema Zod', () => {
  const expected = buildJsonSchemas();

  it('không thiếu / thừa file', () => {
    const files = readdirSync(JSON_SCHEMA_DIR).filter((f) => f.endsWith('.schema.json'));
    expect(files.sort()).toEqual(Object.keys(expected).sort());
  });

  it.each(Object.keys(expected))(
    '%s cập nhật (chạy `pnpm --filter @nom/core schema:export`)',
    (file) => {
      expect(readFileSync(new URL(file, JSON_SCHEMA_DIR), 'utf8')).toBe(expected[file]);
    },
  );

  it('word ở dạng input: các ô là chuỗi, v7 không còn deck/syllables/tones', () => {
    const schema = JSON.parse(expected['word.schema.json']!) as {
      properties: Record<string, { type?: string }>;
      required: string[];
    };
    expect(schema.properties.meaning_vi?.type).toBe('string');
    expect(schema.required.sort()).toEqual(
      ['id', 'lesson_id', 'meaning_vi', 'thai', 'unit_id'].sort(),
    );
    expect(Object.keys(schema.properties)).not.toContain('tones');
  });

  it('sentence: tokens bắt buộc, th_alt/distractors tùy chọn', () => {
    const schema = JSON.parse(expected['sentence.schema.json']!) as { required: string[] };
    expect(schema.required).toContain('tokens');
    expect(schema.required).not.toContain('th_alt');
    expect(schema.required).not.toContain('distractors');
  });
});
