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

  it('word-row ở dạng input: các ô là chuỗi', () => {
    const schema = JSON.parse(expected['word-row.schema.json']!) as {
      properties: Record<string, { type?: string }>;
      required: string[];
    };
    expect(schema.properties.tones?.type).toBe('string');
    expect(schema.required).toEqual(
      expect.arrayContaining([
        'id',
        'thai',
        'phonetic',
        'syllables',
        'tones',
        'meaning_vi',
        'deck',
      ]),
    );
  });
});
