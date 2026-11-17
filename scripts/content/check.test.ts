import { describe, expect, it } from 'vitest';
import { checkContent, compactThai } from './check';
import {
  CONTENT_KINDS,
  emptyContentSet,
  type ContentItem,
  type ContentKind,
  type ContentSet,
} from './load';

// Mẫu tối thiểu theo plan 0.9, chỉ để test quy tắc — không phải nội dung học.
const at = <K extends ContentKind>(kind: K, value: unknown, file: string, line = 1) => ({
  value: CONTENT_KINDS[kind].parse(value) as ContentItem<K>,
  file,
  line,
});

function setOf(patch: Partial<{ [K in ContentKind]: unknown[] }>): ContentSet {
  const set = emptyContentSet();
  for (const [kind, values] of Object.entries(patch) as [ContentKind, unknown[]][]) {
    (set[kind] as unknown[]) = values.map((v, i) => at(kind, v, `${kind}.file`, i + 2));
  }
  return set;
}

const unit = (unit_id = 'u01', extra: object = {}) => ({
  unit_id,
  level: 'A1',
  order: '1',
  title_vi: 'Chào hỏi',
  can_do: 'Chào hỏi',
  ...extra,
});
const lesson = (lesson_id = 'u01-l1', unit_id = 'u01', extra: object = {}) => ({
  lesson_id,
  unit_id,
  order: '1',
  title_vi: 'Bài',
  ...extra,
});
const word = (id: string, thai = 'ดี', extra: object = {}) => ({
  id,
  unit_id: 'u01',
  lesson_id: 'u01-l1',
  thai,
  meaning_vi: 'nghĩa',
  ...extra,
});
const sentence = (id: string, extra: object = {}) => ({
  id,
  unit_id: 'u01',
  lesson_id: 'u01-l1',
  vi: 'Tôi tên là Nam.',
  th: 'ผมชื่อนาม',
  tokens: 'ผม|ชื่อ|นาม',
  ...extra,
});
const grammar = (id = 'g-chue', extra: object = {}) => ({
  id,
  unit_id: 'u01',
  title_vi: 'Nói tên',
  pattern: 'ชื่อ + tên',
  explain_vi: 'x',
  examples: [{ th: 'ผมชื่อนาม', vi: 'Tôi tên là Nam.' }],
  ...extra,
});
const line = { speaker: 'A', th: 'สวัสดี', vi: 'Xin chào.' };
const dialogue = (id = 'd1', lines = 4, extra: object = {}) => ({
  id,
  lesson_id: 'u01-l1',
  lines: Array.from({ length: lines }, () => line),
  ...extra,
});

/** Content hợp lệ, đúng khoảng plan 0.4 → không cảnh báo. */
function valid(patch: Partial<{ [K in ContentKind]: unknown[] }> = {}) {
  return setOf({
    units: [unit()],
    lessons: ['u01-l1', 'u01-l2', 'u01-l3'].map((id) => lesson(id)),
    words: Array.from({ length: 8 }, (_, i) => word(`w${i}`)),
    sentences: [sentence('s1', { grammar_id: 'g-chue' })],
    grammar: [grammar()],
    dialogues: [dialogue()],
    ...patch,
  });
}

/** Bỏ cảnh báo số từ mỗi bài (test riêng ở cuối) để các test khác chỉ cần vài từ. */
const relevant = (content: ContentSet) =>
  checkContent(content).filter((i) => !/^bài có \d+ từ/.test(i.message));

describe('content hợp lệ', () => {
  it('không lỗi, không cảnh báo', () => {
    expect(relevant(valid())).toEqual([]);
  });
});

describe('id duy nhất', () => {
  it('trùng trong cùng loại → lỗi ở mục sau, nêu vị trí mục trước', () => {
    const issues = relevant(valid({ grammar: [grammar(), grammar()] }));
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'error',
        line: 3,
        field: 'id',
        message: expect.stringMatching(/trùng với mẫu câu ở grammar.file:2/),
      }),
    ]);
  });

  it('units/lessons báo ở cột unit_id/lesson_id', () => {
    const issues = relevant(valid({ units: [unit(), unit()] }));
    expect(issues.find((i) => i.severity === 'error')).toMatchObject({ field: 'unit_id' });
  });

  it('cùng id khác loại không tính là trùng', () => {
    expect(relevant(valid({ grammar: [grammar('s1')], sentences: [sentence('s1')] }))).toEqual([]);
  });
});

describe('khóa ngoại', () => {
  const errors = (content: ContentSet) =>
    checkContent(content)
      .filter((i) => i.severity === 'error')
      .map((i) => [i.file, i.field, i.message]);

  it('lesson.unit_id, lesson.grammar_ids', () => {
    expect(
      errors(valid({ lessons: [lesson('u01-l1', 'u09', { grammar_ids: 'g-chue|g-x' })] })),
    ).toEqual(
      expect.arrayContaining([
        ['lessons.file', 'unit_id', 'unit "u09" không có trong units.csv'],
        ['lessons.file', 'grammar_ids.1', 'mẫu câu "g-x" không có trong grammar.yaml'],
      ]),
    );
  });

  it('word/sentence: unit, lesson tồn tại và lesson thuộc đúng unit', () => {
    const content = valid({
      units: [unit(), unit('u02')],
      lessons: [lesson(), lesson('u02-l1', 'u02')],
      words: [word('a', 'ดี', { lesson_id: 'u09-l1' }), word('b', 'ดี', { unit_id: 'u09' })],
      sentences: [sentence('s1', { lesson_id: 'u02-l1' })],
    });
    expect(errors(content)).toEqual([
      ['words.file', 'lesson_id', 'bài "u09-l1" không có trong lessons.csv'],
      ['words.file', 'unit_id', 'unit "u09" không có trong units.csv'],
      ['words.file', 'lesson_id', 'bài "u01-l1" thuộc unit "u01", không phải "u09"'],
      ['sentences.file', 'lesson_id', 'bài "u02-l1" thuộc unit "u02", không phải "u01"'],
    ]);
  });

  it('sentence.grammar_id, grammar.unit_id, dialogue.lesson_id', () => {
    const content = valid({
      sentences: [sentence('s1', { grammar_id: 'g-x' })],
      grammar: [grammar('g-chue', { unit_id: 'u09' })],
      dialogues: [dialogue('d1', 4, { lesson_id: 'l-x' })],
    });
    expect(errors(content)).toEqual([
      ['sentences.file', 'grammar_id', 'mẫu câu "g-x" không có trong grammar.yaml'],
      ['grammar.file', 'unit_id', 'unit "u09" không có trong units.csv'],
      ['dialogues.file', 'lesson_id', 'bài "l-x" không có trong lessons.csv'],
    ]);
  });
});

describe('câu (sentences.csv)', () => {
  const sentenceIssues = (extra: object) =>
    relevant(valid({ sentences: [sentence('s1', extra)] })).map((i) => [i.field, i.message]);

  it('tokens ghép lại ≠ th → lỗi', () => {
    expect(sentenceIssues({ tokens: 'ผม|ชื่อ' })).toEqual([
      ['tokens', 'tokens ghép lại là "ผมชื่อ", không khớp th "ผมชื่อนาม"'],
    ]);
  });

  it('so sánh bỏ khoảng trắng và chuẩn hóa', () => {
    expect(sentenceIssues({ th: 'ผม ชื่อ นาม' })).toEqual([]);
    expect(compactThai(' ก ข ค ')).toBe('กขค');
  });

  it('distractors trùng tokens → lỗi', () => {
    expect(sentenceIssues({ distractors: 'คุณ|ชื่อ' })).toEqual([
      ['distractors.1', 'thẻ nhiễu "ชื่อ" trùng một token của câu'],
    ]);
  });

  it('th_alt trùng th (bỏ khoảng trắng) → lỗi', () => {
    expect(sentenceIssues({ th_alt: 'ผมชื่อนามครับ|ผม ชื่อนาม' })).toEqual([
      ['th_alt.1', 'bản dịch chấp nhận khác trùng với th'],
    ]);
  });
});

describe('ký tự ngoài bảng Thái', () => {
  it('chữ Latin trong trường Thái → lỗi, nêu mã Unicode', () => {
    const issues = relevant(valid({ words: [word('w', 'ดีx')] }));
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'error',
        field: 'thai',
        message: 'ký tự ngoài bảng chữ Thái: "x" (U+0078)',
      }),
    ]);
  });

  it('khoảng trắng, chữ số, dấu câu được phép', () => {
    const content = valid({
      words: [word('w', 'ดี', { example_th: '10 บาท!' })],
      dialogues: [dialogue('d1', 4)],
    });
    expect(relevant(content)).toEqual([]);
  });

  it('kiểm mọi trường Thái: title_th, example_th, th_alt, tokens, distractors, ví dụ, câu thoại', () => {
    const content = valid({
      units: [unit('u01', { title_th: 'ทักทายA' })],
      words: [word('w', 'ดี', { example_th: 'ดีB' })],
      sentences: [
        sentence('s1', { th: 'ผมชื่อนามC', tokens: 'ผม|ชื่อ|นามC', th_alt: 'ผมD', distractors: 'คุณE' }),
      ],
      grammar: [grammar('g-chue', { examples: [{ th: 'ดีF', vi: 'x' }] })],
      dialogues: [dialogue('d1', 4, { lines: Array(4).fill({ ...line, th: 'ดีG' }) })],
    });
    const fields = relevant(content)
      .filter((i) => i.message.startsWith('ký tự'))
      .map((i) => i.field);
    expect(fields).toEqual(
      expect.arrayContaining([
        'title_th',
        'example_th',
        'th',
        'th_alt.0',
        'tokens.2',
        'distractors.0',
        'examples.0.th',
        'lines.0.th',
      ]),
    );
  });
});

describe('cảnh báo cấu trúc bài học (plan 0.4)', () => {
  const warnings = (content: ContentSet) =>
    checkContent(content)
      .filter((i) => i.severity === 'warning')
      .map((i) => [i.file, i.line, i.message]);

  it('unit ngoài 3–4 bài, bài ngoài 8–12 từ, hội thoại ngoài 4–8 câu', () => {
    const content = setOf({
      units: [unit()],
      lessons: [lesson()],
      words: [word('a')],
      dialogues: [dialogue('d1', 9)],
    });
    expect(warnings(content)).toEqual([
      ['units.file', 2, 'unit có 1 bài (khuyến nghị 3–4, plan 0.4)'],
      ['lessons.file', 2, 'bài có 1 từ (khuyến nghị 8–12, plan 0.4)'],
      ['dialogues.file', 2, 'hội thoại có 9 câu (khuyến nghị 4–8, plan 0.4)'],
    ]);
  });

  it('draft: true gộp một cảnh báo mỗi file', () => {
    const content = valid({
      grammar: [grammar('g-chue', { draft: true }), grammar('g-2', { draft: true })],
    });
    expect(relevant(content)).toEqual([
      expect.objectContaining({
        severity: 'warning',
        file: 'grammar.file',
        line: 2,
        message: '2 mục draft: true — chưa được owner duyệt',
      }),
    ]);
  });
});

describe('v7.1 — tài liệu giáo viên (plan 0.11)', () => {
  const messages = (content: ContentSet) =>
    relevant(content).map((i) => [i.severity, i.field, i.message]);

  it('từ draft thiếu nghĩa → cảnh báo từng mục', () => {
    const content = valid({ words: [word('w', 'ดี', { meaning_vi: '', draft: 'true' })] });
    expect(messages(content)).toEqual(
      expect.arrayContaining([
        ['warning', 'meaning_vi', 'thiếu nghĩa — cần điền trước khi bỏ draft'],
      ]),
    );
  });

  it('câu draft thiếu th → cảnh báo, không đối chiếu tokens', () => {
    const content = valid({
      sentences: [sentence('s1', { th: '', tokens: 'ผม', draft: 'true' })],
    });
    expect(messages(content).filter(([sev]) => sev === 'error')).toEqual([]);
    expect(messages(content)).toEqual(
      expect.arrayContaining([
        ['warning', 'th', 'thiếu đáp án tiếng Thái — cần điền trước khi bỏ draft'],
      ]),
    );
  });

  it('câu có th nhưng tokens trống → cảnh báo tự tách', () => {
    expect(messages(valid({ sentences: [sentence('s1', { tokens: '' })] }))).toEqual([
      ['warning', 'tokens', 'tokens tự tách khi build (Intl.Segmenter) — cần duyệt'],
    ]);
  });

  it('classifier / thai_alt chỉ chứa chữ Thái', () => {
    const content = valid({
      words: [word('w', 'เรือ', { classifier: 'ลำx', thai_alt: 'นาวา|เรือboat' })],
    });
    expect(
      relevant(content)
        .filter((i) => i.severity === 'error')
        .map((i) => i.field),
    ).toEqual(['thai_alt.1', 'classifier']);
  });

  it('unit grammar: không áp 8–12 từ/bài, chỉ cảnh báo khi > 40 từ', () => {
    const shape = (n: number) =>
      checkContent(
        setOf({
          units: [unit('u11', { kind: 'grammar' })],
          lessons: ['l1', 'l2', 'l3'].map((id) => lesson(id, 'u11')),
          words: Array.from({ length: n }, (_, i) =>
            word(`w${i}`, 'ดี', { unit_id: 'u11', lesson_id: 'l1' }),
          ),
        }),
      )
        .filter((i) => i.file === 'lessons.file')
        .map((i) => [i.line, i.message]);
    expect(shape(2)).toEqual([]);
    expect(shape(41)).toEqual([[2, 'bài có 41 từ (unit ngữ pháp: tối đa 40, nên chia bài)']]);
  });
});
