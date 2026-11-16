import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectKind, formatIssue, loadContent, loadFile, normalizeStrings } from './load';

// Dữ liệu ở đây chỉ để test cấu trúc loader (mẫu plan 5.5), không phải nội dung học.
const CONSONANTS = `- { id: ko-kai, char: ก, name: ก ไก่, class: mid, initial: k, final: k, phonetic: k, keyword_vi: con gà, order: 1 }
- { id: kho-khai, char: ข, name: ข ไข่, class: high, initial: kh, phonetic: kh, keyword_vi: quả trứng, order: 2 }
`;
const WORDS_HEADER = 'id,thai,phonetic,syllables,tones,meaning_vi,deck,draft';
const WORDS = `${WORDS_HEADER}
sawatdee,สวัสดี,sa-wat-di,ส|วัส|ดี,low|low|mid,xin chào,bai-01,true
`;
const READING = `id: lvl1-001
title_vi: Chào hỏi
level: 1
sentences:
  - { th: "สวัสดี|ครับ", vi: "Xin chào (nam nói)" }
`;

// Ký tự vô hình/dấu khai báo bằng code point để không lẫn trong mã nguồn (như thai/normalize.ts).
const ch = (code: number) => String.fromCodePoint(code);
const BOM = ch(0xfeff);
const ZWSP = ch(0x200b);
const MO = ch(0x0e21); // ม
const MAI_THO = ch(0x0e49); // ้
const SARA_II = ch(0x0e35); // ี

let dir: string;
async function tree(files: Record<string, string>) {
  dir = await mkdtemp(path.join(tmpdir(), 'nom-content-'));
  for (const [rel, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
    await writeFile(path.join(dir, rel), text, 'utf8');
  }
  return dir;
}
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('loadContent', () => {
  it('đọc file chuẩn plan 5.4 + mọi bài đọc, kèm dòng của từng mục', async () => {
    const root = await tree({
      'alphabet/consonants.yaml': CONSONANTS,
      'vocab/words.csv': WORDS,
      'readings/lvl1-001-chao-hoi.yaml': READING,
      'readings/ghi-chu.txt': 'bỏ qua',
    });
    const { content, issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([]);
    expect(content.consonants.map((c) => [c.value.id, c.file, c.line])).toEqual([
      ['ko-kai', 'alphabet/consonants.yaml', 1],
      ['kho-khai', 'alphabet/consonants.yaml', 2],
    ]);
    expect(content.consonants[1]!.value.final).toBeNull();
    expect(content.words[0]).toMatchObject({ file: 'vocab/words.csv', line: 2 });
    expect(content.words[0]!.value.tones).toEqual(['low', 'low', 'mid']);
    expect(content.words[0]!.value.draft).toBe(true);
    expect(content.readings[0]!.value.sentences[0]!.th).toBe('สวัสดี|ครับ');
    expect(content.vowels).toEqual([]);
  });

  it('thư mục không tồn tại → lỗi', async () => {
    const { issues } = await loadContent(path.join(tmpdir(), 'khong-co-thu-muc-nay-xyz'));
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toMatch(/không tìm thấy/);
  });
});

describe('YAML', () => {
  it('lỗi schema chỉ đúng dòng/cột của trường', async () => {
    const root = await tree({
      'alphabet/consonants.yaml': `- id: ko-kai
  char: ก
  name: ก ไก่
  class: middle
  initial: k
  phonetic: k
  keyword_vi: con gà
  order: 1
`,
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'error',
        file: 'alphabet/consonants.yaml',
        line: 4,
        column: 10,
        field: 'class',
      }),
    ]);
  });

  it('trường thiếu → báo ở dòng đầu của mục', async () => {
    const root = await tree({
      'alphabet/consonants.yaml': `${CONSONANTS}- { id: x, char: ค, name: ค ควาย, class: low, initial: kh, phonetic: kh, order: 3 }\n`,
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([expect.objectContaining({ line: 3, field: 'keyword_vi' })]);
  });

  it('trường lạ (gõ sai tên) → nêu tên trường', async () => {
    const root = await tree({
      'alphabet/consonants.yaml': CONSONANTS.replace('keyword_vi: con gà', 'keywrd_vi: con gà'),
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues.map((i) => i.field)).toContain('keywrd_vi');
    expect(issues.find((i) => i.field === 'keywrd_vi')!.line).toBe(1);
  });

  it('lỗi cú pháp YAML kèm dòng', async () => {
    const root = await tree({ 'alphabet/tones.yaml': '- id: mid\n  label_vi: [Ngang\n' });
    const { issues, content } = await loadContent(root, { cwd: root });
    expect(content.tones).toEqual([]);
    expect(issues[0]).toMatchObject({ severity: 'error', file: 'alphabet/tones.yaml' });
    expect(issues[0]!.message).toMatch(/^YAML:/);
    expect(issues[0]!.line).toBeGreaterThan(0);
  });

  it('key trùng trong một mục → lỗi YAML', async () => {
    const root = await tree({
      'vocab/decks.yaml': '- id: a\n  id: b\n  title_vi: A\n  order: 1\n',
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues[0]).toMatchObject({ severity: 'error', line: 2 });
  });

  it('sai dạng gốc: file danh sách nhưng là object, bài đọc nhưng là danh sách', async () => {
    const root = await tree({
      'vocab/decks.yaml': 'id: bai-01\n',
      'readings/a.yaml': `- ${READING.split('\n')[0]}\n`,
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues.map((i) => [i.file, i.line, i.message])).toEqual([
      ['vocab/decks.yaml', 1, expect.stringMatching(/danh sách/)],
      ['readings/a.yaml', 1, expect.stringMatching(/một mục/)],
    ]);
  });

  it('file rỗng → không có mục, không lỗi', async () => {
    const root = await tree({ 'alphabet/vowels.yaml': '# chưa có\n' });
    expect(await loadContent(root, { cwd: root })).toMatchObject({ issues: [] });
  });

  it('lỗi trong mảng lồng (bài đọc) chỉ đúng dòng câu', async () => {
    const root = await tree({
      'readings/lvl1-001.yaml': `${READING}  - { th: "hello", vi: "x" }\n`,
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([expect.objectContaining({ line: 6, field: 'sentences.1.th' })]);
  });
});

describe('CSV', () => {
  it('lỗi kèm dòng (tính cả header) và trường; dòng hợp lệ vẫn được đọc', async () => {
    const root = await tree({
      'vocab/words.csv': `${WORDS}di,ดี,di,ดี,ngang,tốt,bai-01,\nsong,สอง,song,สอง,rising|mid,hai,bai-01,\n`,
    });
    const { content, issues } = await loadContent(root, { cwd: root });
    expect(content.words.map((w) => w.value.id)).toEqual(['sawatdee']);
    expect(issues).toEqual([
      expect.objectContaining({ file: 'vocab/words.csv', line: 3, field: 'tones.0' }),
      expect.objectContaining({ line: 4, field: 'tones' }),
    ]);
  });

  it('BOM của Excel và CRLF không ảnh hưởng', async () => {
    const root = await tree({ 'vocab/words.csv': `${BOM}${WORDS.replaceAll('\n', '\r\n')}` });
    const { content, issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([]);
    expect(content.words[0]!.value.id).toBe('sawatdee');
  });

  it('thiếu cột bắt buộc → lỗi ở từng dòng nêu cột', async () => {
    const root = await tree({ 'vocab/words.csv': 'id,thai\nx,ดี\n' });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues.map((i) => i.field)).toEqual(
      expect.arrayContaining(['phonetic', 'syllables', 'tones', 'meaning_vi', 'deck']),
    );
    expect(issues.every((i) => i.line === 2)).toBe(true);
  });

  it('số cột lệch header → lỗi CSV kèm dòng', async () => {
    const root = await tree({ 'vocab/words.csv': `${WORDS}a,b\n` });
    const { issues, content } = await loadContent(root, { cwd: root });
    expect(content.words).toEqual([]);
    expect(issues).toEqual([expect.objectContaining({ line: 3 })]);
    expect(issues[0]!.message).toMatch(/^CSV:/);
  });
});

describe('chuẩn hóa chữ Thái', () => {
  it('dấu thanh gõ trước nguyên âm trên + ZWSP được chuẩn hóa trước khi parse', async () => {
    // ม + ้ + ี (sai thứ tự) + ZWSP → ม + ี + ้
    const typed = MO + MAI_THO + SARA_II + ZWSP;
    const root = await tree({
      'vocab/words.csv': `${WORDS_HEADER}\nmii,${typed},mi,${typed},falling,có,bai-01,\n`,
    });
    const { content } = await loadContent(root, { cwd: root });
    expect(content.words[0]!.value.thai).toBe(MO + SARA_II + MAI_THO);
    expect(content.words[0]!.value.syllables).toEqual([MO + SARA_II + MAI_THO]);
  });

  it('normalizeStrings đi qua mảng/object, giữ nguyên số/boolean/null', () => {
    expect(normalizeStrings({ a: [MO + MAI_THO + SARA_II], b: 1, c: null, d: true })).toEqual({
      a: [MO + SARA_II + MAI_THO],
      b: 1,
      c: null,
      d: true,
    });
  });
});

describe('detectKind / loadFile', () => {
  it.each([
    ['content/alphabet/consonants.yaml', 'consonants'],
    ['content/alphabet/tone-drills.yaml', 'toneDrills'],
    ['content/alphabet/tone-marks.yml', 'toneMarks'],
    ['staging/words.giao-trinh-a.csv', 'words'],
    ['staging/tone-drills.giao-trinh-a.yaml', 'toneDrills'],
    ['content/readings/lvl1-001.yaml', 'readings'],
    ['content/listening/minimal-pairs.yaml', 'minimalPairs'],
    ['staging/khac.csv', null],
    ['staging/ghi-chu.txt', null],
    ['staging/la.yaml', null],
  ])('%s → %s', (file, kind) => {
    expect(detectKind(file)).toBe(kind);
  });

  it('loadFile đọc file staging ngoài content/', async () => {
    const root = await tree({ 'staging/words.sach-a.csv': WORDS });
    const result = await loadFile(path.join(root, 'staging/words.sach-a.csv'), 'words', {
      cwd: root,
    });
    expect(result.items[0]).toMatchObject({ file: 'staging/words.sach-a.csv', line: 2 });
  });
});

describe('formatIssue', () => {
  it('file:dòng:cột [trường]', () => {
    expect(
      formatIssue({
        severity: 'error',
        file: 'a.yaml',
        line: 4,
        column: 10,
        field: 'class',
        message: 'sai',
      }),
    ).toBe('a.yaml:4:10 lỗi [class]: sai');
    expect(formatIssue({ severity: 'warning', file: 'b.csv', line: 3, message: 'x' })).toBe(
      'b.csv:3 cảnh báo: x',
    );
    expect(formatIssue({ severity: 'error', file: 'content', message: 'y' })).toBe(
      'content lỗi: y',
    );
  });
});
