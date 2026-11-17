import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildContent,
  segmentThai,
  withTokens,
  type Manifest,
  type UnitBundle,
  type UnitSummary,
} from './build';
import { loadContent } from './load';

// Mẫu tối thiểu chỉ để test build — không phải nội dung học.
const csv = (...lines: string[]) => `${lines.join('\n')}\n`;
const FILES = {
  'units.csv':
    'unit_id,level,order,title_vi,can_do\nu02,A1,2,Gia đình,Nói về gia đình\nu01,A1,1,Chào hỏi,Chào hỏi\n',
  'lessons.csv':
    'lesson_id,unit_id,order,title_vi\nu01-l2,u01,2,Bài 2\nu01-l1,u01,1,Bài 1\nu02-l1,u02,1,Bài 1\n',
  'words.csv':
    'id,unit_id,lesson_id,thai,meaning_vi\ndi,u01,u01-l1,ดี,tốt; hay\nma,u01,u01-l2,มา,đến\nphi,u02,u02-l1,พี่,anh chị\n',
  'sentences.csv': 'id,unit_id,lesson_id,vi,th,tokens\ns1,u01,u01-l1,Tốt.,ดี,ดี\n',
  'grammar.yaml':
    '- { id: g1, unit_id: u01, title_vi: A, pattern: ดี, explain_vi: x, examples: [{ th: ดี, vi: tốt }] }\n',
  'dialogues.yaml': '- { id: d1, lesson_id: u02-l1, lines: [{ speaker: A, th: ดี, vi: tốt }] }\n',
};

let dir: string;
async function setup(files: Record<string, string> = FILES) {
  dir = await mkdtemp(path.join(tmpdir(), 'nom-build-'));
  await mkdir(path.join(dir, 'content'), { recursive: true });
  for (const [rel, text] of Object.entries(files)) {
    await writeFile(path.join(dir, 'content', rel), text, 'utf8');
  }
  const { content, issues } = await loadContent(path.join(dir, 'content'));
  expect(issues).toEqual([]);
  return { content, out: path.join(dir, 'out') };
}
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

const readJson = async <T>(file: string) => JSON.parse(await readFile(file, 'utf8')) as T;

describe('buildContent', () => {
  it('units.json (lộ trình) + unit-<id>.json + manifest', async () => {
    const { content, out } = await setup();
    const { manifest, written } = await buildContent(content, out);

    expect((await readdir(out)).sort()).toEqual([
      'manifest.json',
      'unit-u01.json',
      'unit-u02.json',
      'units.json',
    ]);
    expect(written).toHaveLength(4);

    const units = await readJson<UnitSummary[]>(path.join(out, 'units.json'));
    expect(units.map((u) => u.unit_id)).toEqual(['u01', 'u02']);
    expect(units[0]).toMatchObject({ order: 1, words: 2, sentences: 1, can_do: ['Chào hỏi'] });
    expect(units[0]!.lessons.map((l) => [l.lesson_id, l.words, l.sentences])).toEqual([
      ['u01-l1', 1, 1],
      ['u01-l2', 1, 0],
    ]);

    const u01 = await readJson<UnitBundle>(path.join(out, 'unit-u01.json'));
    expect(u01.unit.unit_id).toBe('u01');
    expect(u01.words.map((w) => w.id)).toEqual(['di', 'ma']);
    expect(u01.words[0]!.meaning_vi).toEqual(['tốt', 'hay']);
    expect(u01.grammar.map((g) => g.id)).toEqual(['g1']);
    expect(u01.dialogues).toEqual([]);
    const u02 = await readJson<UnitBundle>(path.join(out, 'unit-u02.json'));
    expect(u02.dialogues.map((d) => d.id)).toEqual(['d1']);
    expect(u02.words[0]).not.toHaveProperty('file');

    expect(await readJson<Manifest>(path.join(out, 'manifest.json'))).toEqual(manifest);
    expect(manifest.files['units.json']!.count).toBe(2);
    // unit + 2 bài + 2 từ + 1 câu + 1 mẫu câu.
    expect(manifest.files['unit-u01.json']!.count).toBe(7);
    expect(manifest.version).toMatch(/^[0-9a-f]{16}$/);
  });

  it('idempotent: chạy lần 2 không ghi gì, byte giống hệt', async () => {
    const { content, out } = await setup();
    await buildContent(content, out);
    const before = await readFile(path.join(out, 'manifest.json'), 'utf8');
    const mtime = (await stat(path.join(out, 'unit-u01.json'))).mtimeMs;

    const again = await buildContent(content, out);
    expect(again.written).toEqual([]);
    expect(await readFile(path.join(out, 'manifest.json'), 'utf8')).toBe(before);
    expect((await stat(path.join(out, 'unit-u01.json'))).mtimeMs).toBe(mtime);
  });

  it('đổi từ của một unit → chỉ unit đó + units.json + manifest được ghi, version đổi', async () => {
    const first = await setup();
    const { manifest: m1 } = await buildContent(first.content, first.out);
    const { content } = await loadContent(path.join(dir, 'content'));
    content.words.pop(); // phi (u02)
    const { manifest: m2, written } = await buildContent(content, first.out);
    expect(written).toEqual(['units.json', 'unit-u02.json', 'manifest.json']);
    expect(m2.version).not.toBe(m1.version);
    expect(m2.files['unit-u01.json']!.hash).toBe(m1.files['unit-u01.json']!.hash);
  });

  it('xoá JSON cũ (M3, unit đã bỏ), giữ file khác', async () => {
    const { content, out } = await setup();
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, 'words.json'), '[]');
    await writeFile(path.join(out, 'unit-u09.json'), '{}');
    await writeFile(path.join(out, 'README.txt'), 'x');
    const { removed } = await buildContent(content, out);
    expect(removed).toEqual(['unit-u09.json', 'words.json']);
    expect(await readdir(out)).toContain('README.txt');
  });

  it('cùng order → sắp theo id', async () => {
    const { content, out } = await setup({
      ...FILES,
      'units.csv': 'unit_id,level,order,title_vi,can_do\nu02,A1,1,B,x\nu01,A1,1,A,x\n',
    });
    await buildContent(content, out);
    const units = await readJson<UnitSummary[]>(path.join(out, 'units.json'));
    expect(units.map((u) => u.unit_id)).toEqual(['u01', 'u02']);
  });
});

describe('v7.1 (plan 0.11)', () => {
  it('bundle có kind/level; lesson có steps = bước có dữ liệu', async () => {
    const { content, out } = await setup({
      ...FILES,
      'units.csv': csv(
        'unit_id,level,kind,order,title_vi,can_do',
        'u01,A1,,1,A,x',
        'u02,,grammar,2,B,x',
      ),
      'lessons.csv': csv(
        'lesson_id,unit_id,order,title_vi,grammar_ids',
        'u01-l1,u01,1,A,g1',
        'u01-l2,u01,2,B,',
        'u02-l1,u02,1,C,g1',
      ),
      'sentences.csv': csv(
        'id,unit_id,lesson_id,vi,th,tokens,draft',
        's1,u01,u01-l1,Tốt.,ดี,ดี,',
        's2,u01,u01-l2,Chưa có đáp án.,,,true',
      ),
    });
    await buildContent(content, out);
    const units = await readJson<UnitSummary[]>(path.join(out, 'units.json'));
    expect(units.map((u) => [u.unit_id, u.kind, u.level])).toEqual([
      ['u01', 'theme', 'A1'],
      ['u02', 'grammar', undefined],
    ]);
    expect(units[0]!.lessons.map((l) => l.steps)).toEqual([
      ['vocab', 'grammar', 'exercise'],
      // u01-l2: chỉ có từ; câu chưa có th không tạo bước bài tập.
      ['vocab'],
    ]);
    // unit grammar: Mẫu câu trước Từ vựng; có hội thoại d1.
    const u02 = await readJson<UnitBundle>(path.join(out, 'unit-u02.json'));
    expect(u02.lessons[0]!.steps).toEqual(['grammar', 'vocab', 'dialogue']);
  });

  it('tokens trống + có th → tự tách, auto_tokens; không có th → giữ nguyên', () => {
    const base = {
      id: 's',
      unit_id: 'u',
      lesson_id: 'l',
      vi: 'x',
      th_alt: [],
      distractors: [],
      source: undefined,
      draft: true,
    };
    const auto = withTokens({ ...base, th: 'ผมชื่อสมชาย', tokens: [] });
    expect(auto.auto_tokens).toBe(true);
    expect(auto.tokens.join('')).toBe('ผมชื่อสมชาย');
    expect(auto.tokens.length).toBeGreaterThan(1);
    const given = { ...base, th: 'ดี', tokens: ['ดี'] };
    expect(withTokens(given)).toBe(given);
    const noTh = { ...base, tokens: [] };
    expect(withTokens(noTh)).toBe(noTh);
  });

  it('segmentThai bỏ khoảng trắng và dấu câu', () => {
    expect(segmentThai('มีค่ะ พี่สาว').join('')).toBe('มีค่ะพี่สาว');
  });
});
