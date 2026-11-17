import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Sentence, Unit, Word } from '../schema';
import {
  ManifestSchema,
  unitFile,
  UnitBundleSchema,
  UnitsFileSchema,
  type BuiltLesson,
  type BuiltSentence,
  type UnitBundle,
  type UnitSummary,
} from './bundle';

const unit = {
  unit_id: 'u01',
  level: 'A1',
  kind: 'theme',
  order: 1,
  title_vi: 'Chào hỏi',
  can_do: ['Chào hỏi lịch sự'],
  draft: true,
};
const lesson = {
  lesson_id: 'u01-l1',
  unit_id: 'u01',
  order: 1,
  title_vi: 'Xin chào',
  grammar_ids: [],
  draft: true,
  steps: ['vocab', 'exercise'],
};
const bundle = {
  unit,
  lessons: [lesson],
  words: [
    {
      id: 'sawatdee',
      unit_id: 'u01',
      lesson_id: 'u01-l1',
      thai: 'สวัสดี',
      thai_alt: [],
      meaning_vi: ['xin chào'],
      tags: [],
      draft: true,
    },
  ],
  sentences: [
    {
      id: 's-u01-001',
      unit_id: 'u01',
      lesson_id: 'u01-l1',
      vi: 'Xin chào.',
      th: 'สวัสดี',
      th_alt: [],
      tokens: ['สวัสดี'],
      distractors: [],
      draft: true,
      auto_tokens: true,
    },
  ],
  grammar: [],
  dialogues: [],
};

describe('bundle JSON (T7.1)', () => {
  it('giá trị schema CSV ghi thẳng vào bundle được (build không cần chuyển kiểu)', () => {
    expectTypeOf<Unit>().toExtend<UnitBundle['unit']>();
    expectTypeOf<Word>().toExtend<UnitBundle['words'][number]>();
    expectTypeOf<Sentence>().toExtend<BuiltSentence>();
    expectTypeOf<BuiltLesson['steps']>().toEqualTypeOf<
      ('vocab' | 'grammar' | 'dialogue' | 'exercise')[]
    >();
  });

  it('đọc unit-<id>.json hợp lệ', () => {
    const parsed = UnitBundleSchema.parse(bundle);
    expect(parsed.sentences[0]?.auto_tokens).toBe(true);
    expect(parsed.unit.title_th).toBeUndefined();
  });

  it('báo lỗi khi JSON sai dạng (bước lạ, thiếu mảng)', () => {
    const bad = { ...bundle, lessons: [{ ...lesson, steps: ['quiz'] }], words: undefined };
    const result = UnitBundleSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join('.'))).toEqual(
      expect.arrayContaining(['lessons.0.steps.0', 'words']),
    );
  });

  it('đọc units.json (lộ trình kèm số từ/câu)', () => {
    const summary: UnitSummary[] = UnitsFileSchema.parse([
      { ...unit, lessons: [{ ...lesson, words: 1, sentences: 1 }], words: 1, sentences: 1 },
    ]);
    expect(summary[0]?.lessons[0]?.words).toBe(1);
    expect(UnitsFileSchema.safeParse([{ ...unit, words: -1 }]).success).toBe(false);
  });

  it('manifest: version + hash 16 ký tự hex', () => {
    const manifest = {
      version: '0123456789abcdef',
      files: { [unitFile('u01')]: { hash: 'fedcba9876543210', count: 4 } },
    };
    expect(ManifestSchema.parse(manifest).files['unit-u01.json']?.count).toBe(4);
    expect(ManifestSchema.safeParse({ ...manifest, version: 'v1' }).success).toBe(false);
  });
});
