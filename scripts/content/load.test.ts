import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  detectKind,
  formatIssue,
  idOf,
  loadContent,
  loadFile,
  normalizeStrings,
} from './load';

// Dữ liệu ở đây chỉ để test cấu trúc loader (mẫu plan 0.9), không phải nội dung học.
const UNITS = `unit_id,level,order,title_vi,title_th,can_do,draft
u01,A1,1,Chào hỏi,ทักทาย,Chào hỏi|Giới thiệu tên,true
`;
const LESSONS = `lesson_id,unit_id,order,title_vi,grammar_ids
u01-l1,u01,1,Xin chào,g-chue
`;
const WORDS_HEADER =
  'id,unit_id,lesson_id,thai,meaning_vi,pos,phonetic,example_th,example_vi,image,tags,source,draft';
const WORDS = `${WORDS_HEADER}
sawatdee,u01,u01-l1,สวัสดี,xin chào; tạm biệt,interj,sa-wat-di,,,noto:1f44b,polite,,true
`;
const SENTENCES = `id,unit_id,lesson_id,vi,th,th_alt,tokens,distractors,grammar_id,audio,source
s1,u01,u01-l1,Tôi tên là Nam.,ผมชื่อนาม,ผมชื่อนามครับ,ผม|ชื่อ|นาม,คุณ,g-chue,,
`;
const GRAMMAR = `- id: g-chue
  unit_id: u01
  title_vi: Nói tên
  pattern: ชื่อ + tên
  explain_vi: Dùng ชื่อ để nói tên.
  examples:
    - { th: ผมชื่อนาม, vi: Tôi tên là Nam. }
`;
const DIALOGUES = `- id: d1
  lesson_id: u01-l1
  lines:
    - { speaker: A, th: สวัสดีครับ, vi: Xin chào. }
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
  it('đọc 6 file plan 0.9 kèm dòng của từng mục; bỏ qua content/templates/', async () => {
    const root = await tree({
      'units.csv': UNITS,
      'lessons.csv': LESSONS,
      'words.csv': WORDS,
      'sentences.csv': SENTENCES,
      'grammar.yaml': GRAMMAR,
      'dialogues.yaml': DIALOGUES,
      'templates/units.csv': 'hỏng,"\n',
    });
    const { content, issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([]);
    expect(content.units[0]).toMatchObject({ file: 'units.csv', line: 2 });
    expect(content.units[0]!.value).toMatchObject({ order: 1, can_do: ['Chào hỏi', 'Giới thiệu tên'] });
    expect(content.lessons[0]!.value.grammar_ids).toEqual(['g-chue']);
    expect(content.words[0]!.value).toMatchObject({ meaning_vi: ['xin chào', 'tạm biệt'], draft: true });
    expect(content.sentences[0]!.value.tokens).toEqual(['ผม', 'ชื่อ', 'นาม']);
    expect(content.grammar[0]).toMatchObject({ file: 'grammar.yaml', line: 1 });
    expect(content.dialogues[0]!.value.lines).toHaveLength(1);
  });

  it('thư mục không tồn tại → lỗi', async () => {
    const { issues } = await loadContent(path.join(tmpdir(), 'khong-co-thu-muc-nay-xyz'));
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toMatch(/không tìm thấy/);
  });

  it('idOf theo cột id của từng loại', async () => {
    const root = await tree({ 'units.csv': UNITS, 'words.csv': WORDS });
    const { content } = await loadContent(root, { cwd: root });
    expect(idOf('units', content.units[0]!.value)).toBe('u01');
    expect(idOf('words', content.words[0]!.value)).toBe('sawatdee');
  });
});

describe('YAML', () => {
  it('lỗi schema chỉ đúng dòng/cột của trường lồng', async () => {
    const root = await tree({
      'grammar.yaml': GRAMMAR.replace('{ th: ผมชื่อนาม,', '{ th: Phom chue Nam,'),
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'error',
        file: 'grammar.yaml',
        line: 7,
        column: 13,
        field: 'examples.0.th',
      }),
    ]);
  });

  it('trường thiếu → báo ở dòng đầu của mục', async () => {
    const root = await tree({
      'dialogues.yaml': `${DIALOGUES}- id: d2\n  lines: [{ speaker: B, th: ดี, vi: tốt }]\n`,
    });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([expect.objectContaining({ line: 5, field: 'lesson_id' })]);
  });

  it('trường lạ (gõ sai tên) → nêu tên trường', async () => {
    const root = await tree({ 'grammar.yaml': GRAMMAR.replace('explain_vi:', 'explian_vi:') });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues.map((i) => i.field)).toContain('explian_vi');
    expect(issues.find((i) => i.field === 'explian_vi')!.line).toBe(1);
  });

  it('lỗi cú pháp YAML kèm dòng', async () => {
    const root = await tree({ 'grammar.yaml': '- id: g1\n  title_vi: [Nói\n' });
    const { issues, content } = await loadContent(root, { cwd: root });
    expect(content.grammar).toEqual([]);
    expect(issues[0]).toMatchObject({ severity: 'error', file: 'grammar.yaml' });
    expect(issues[0]!.message).toMatch(/^YAML:/);
    expect(issues[0]!.line).toBeGreaterThan(0);
  });

  it('key trùng trong một mục → lỗi YAML', async () => {
    const root = await tree({ 'dialogues.yaml': '- id: a\n  id: b\n' });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues[0]).toMatchObject({ severity: 'error', line: 2 });
  });

  it('file không phải danh sách → lỗi', async () => {
    const root = await tree({ 'grammar.yaml': 'id: g1\n' });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues.map((i) => [i.file, i.line, i.message])).toEqual([
      ['grammar.yaml', 1, expect.stringMatching(/danh sách/)],
    ]);
  });

  it('file rỗng → không có mục, không lỗi', async () => {
    const root = await tree({ 'dialogues.yaml': '# chưa có\n' });
    expect(await loadContent(root, { cwd: root })).toMatchObject({ issues: [] });
  });
});

describe('CSV', () => {
  it('lỗi kèm dòng (tính cả header) và trường; dòng hợp lệ vẫn được đọc', async () => {
    const root = await tree({
      'sentences.csv': `${SENTENCES}s2,u01,u01-l1,Tốt.,ดี,,,,,,\ns3,u01,u01-l1,Tốt.,ดี,,ดี|good,,,,\n`,
    });
    const { content, issues } = await loadContent(root, { cwd: root });
    expect(content.sentences.map((s) => s.value.id)).toEqual(['s1']);
    expect(issues).toEqual([
      expect.objectContaining({ file: 'sentences.csv', line: 3, field: 'tokens' }),
      expect.objectContaining({ line: 4, field: 'tokens.1' }),
    ]);
  });

  it('BOM của Excel và CRLF không ảnh hưởng', async () => {
    const root = await tree({ 'units.csv': `${BOM}${UNITS.replaceAll('\n', '\r\n')}` });
    const { content, issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([]);
    expect(content.units[0]!.value.unit_id).toBe('u01');
  });

  it('thiếu cột bắt buộc → lỗi ở từng dòng nêu cột', async () => {
    const root = await tree({ 'words.csv': 'id,thai\nx,ดี\n' });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues.map((i) => i.field)).toEqual(
      expect.arrayContaining(['unit_id', 'lesson_id', 'meaning_vi']),
    );
    expect(issues.every((i) => i.line === 2)).toBe(true);
  });

  it('cột cũ (deck) → lỗi trường lạ', async () => {
    const root = await tree({ 'lessons.csv': 'lesson_id,unit_id,order,title_vi,deck\nl1,u01,1,A,x\n' });
    const { issues } = await loadContent(root, { cwd: root });
    expect(issues).toEqual([expect.objectContaining({ line: 2, field: 'deck' })]);
  });

  it('số cột lệch header → lỗi CSV kèm dòng', async () => {
    const root = await tree({ 'units.csv': `${UNITS}a,b\n` });
    const { issues, content } = await loadContent(root, { cwd: root });
    expect(content.units).toEqual([]);
    expect(issues).toEqual([expect.objectContaining({ line: 3 })]);
    expect(issues[0]!.message).toMatch(/^CSV:/);
  });
});

describe('chuẩn hóa chữ Thái', () => {
  it('dấu thanh gõ trước nguyên âm trên + ZWSP được chuẩn hóa trước khi parse', async () => {
    // ม + ้ + ี (sai thứ tự) + ZWSP → ม + ี + ้
    const typed = MO + MAI_THO + SARA_II + ZWSP;
    const root = await tree({
      'words.csv': `${WORDS_HEADER}\nmii,u01,u01-l1,${typed},có,,,${typed},,,,,\n`,
    });
    const { content } = await loadContent(root, { cwd: root });
    expect(content.words[0]!.value.thai).toBe(MO + SARA_II + MAI_THO);
    expect(content.words[0]!.value.example_th).toBe(MO + SARA_II + MAI_THO);
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
    ['content/units.csv', 'units'],
    ['content/templates/lessons.csv', 'lessons'],
    ['staging/words.giao-trinh-a.csv', 'words'],
    ['staging/sentences.giao-trinh-a.csv', 'sentences'],
    ['staging/grammar.giao-trinh-a.yaml', 'grammar'],
    ['staging/dialogues.yml', 'dialogues'],
    ['staging/words.yaml', null],
    ['staging/grammar.csv', null],
    ['staging/khac.csv', null],
    ['staging/ghi-chu.txt', null],
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
