import { describe, expect, it } from 'vitest';
import type { UnitBundle } from '../content/bundle';
import { buildLessonQuiz, checkLessonAnswer, QUIZ_MAX_QUESTIONS } from './lesson-quiz';

// Dữ liệu GIẢ LẬP — không phải content thật.
const word = (id: string, thai: string, meaning: string[], lesson = 'l1') => ({
  id,
  unit_id: 'u01',
  lesson_id: lesson,
  thai,
  thai_alt: [],
  meaning_vi: meaning,
  tags: [],
  draft: true,
});
const sentence = (
  id: string,
  tokens: string[],
  extra: Partial<UnitBundle['sentences'][number]> = {},
) => ({
  id,
  unit_id: 'u01',
  lesson_id: 'l1',
  vi: `Câu ${id}`,
  ...(tokens.length ? { th: tokens.join('') } : {}),
  th_alt: [],
  tokens,
  distractors: [],
  draft: true,
  ...extra,
});

const bundle: Pick<UnitBundle, 'words' | 'sentences'> = {
  words: [
    word('a', 'ก', ['một', 'số một']),
    word('b', 'ข', ['hai']),
    word('c', 'ค', ['ba']),
    word('d', 'ง', []),
    word('e', 'จ', ['năm'], 'l2'),
  ],
  sentences: [
    sentence('s1', ['ผม', 'ชื่อ', 'นิด'], { distractors: ['คุณ'], th_alt: ['ผมชื่อนิดครับ'] }),
    sentence('s2', ['ดี']),
    sentence('s3', []),
  ],
};

describe('bài tập của bài học (M7, SCR-05)', () => {
  it('từ có nghĩa → chọn nghĩa (nhiễu từ từ khác của unit); câu có đáp án + ≥ 2 thẻ → xếp câu', () => {
    const quiz = buildLessonQuiz(bundle, 'l1', 1);
    expect(quiz.map((q) => q.itemId).sort()).toEqual(['a', 'b', 'c', 's1']);
    const a = quiz.find((q) => q.itemId === 'a')!;
    expect(a).toMatchObject({ kind: 'meaning', th: 'ก', expected: 'một; số một' });
    if (a.kind !== 'meaning') throw new Error();
    expect(a.options).toHaveLength(4);
    expect(a.options).toContain('năm');
    const s1 = quiz.find((q) => q.itemId === 's1')!;
    if (s1.kind !== 'arrange') throw new Error();
    expect([...s1.bank].sort()).toEqual(['คุณ', 'ชื่อ', 'นิด', 'ผม'].sort());
    expect(buildLessonQuiz(bundle, 'l1', 1)).toEqual(quiz);
  });

  it(`tối đa ${QUIZ_MAX_QUESTIONS} câu, xếp câu tối đa một nửa`, () => {
    const many = {
      words: Array.from({ length: 20 }, (_, i) => word(`w${i}`, `ก${i}`, [`nghĩa ${i}`])),
      sentences: Array.from({ length: 20 }, (_, i) => sentence(`s${i}`, [`ก${i}`, 'ข'])),
    };
    const quiz = buildLessonQuiz(many, 'l1', 2);
    expect(quiz).toHaveLength(QUIZ_MAX_QUESTIONS);
    expect(quiz.filter((q) => q.kind === 'arrange')).toHaveLength(QUIZ_MAX_QUESTIONS / 2);
  });

  it('chấm: nghĩa khớp nguyên văn; xếp câu bỏ khoảng trắng, nhận th_alt', () => {
    const quiz = buildLessonQuiz(bundle, 'l1', 1);
    const a = quiz.find((q) => q.itemId === 'a')!;
    const s1 = quiz.find((q) => q.itemId === 's1')!;
    expect(checkLessonAnswer(a, 'một; số một')).toBe(true);
    expect(checkLessonAnswer(a, 'hai')).toBe(false);
    expect(checkLessonAnswer(s1, ['ผม', 'ชื่อ', 'นิด'])).toBe(true);
    expect(checkLessonAnswer(s1, 'ผม ชื่อนิด ครับ')).toBe(true);
    expect(checkLessonAnswer(s1, ['ชื่อ', 'ผม', 'นิด'])).toBe(false);
  });
});
