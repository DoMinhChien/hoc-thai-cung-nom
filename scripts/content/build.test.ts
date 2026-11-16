import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildContent, type Manifest } from './build';
import { loadContent } from './load';

// Mẫu tối thiểu chỉ để test build — không phải nội dung học.
const FILES = {
  'vocab/decks.yaml': '- { id: bai-01, title_vi: Bài 1, order: 1, draft: true }\n',
  'vocab/words.csv':
    'id,thai,phonetic,syllables,tones,meaning_vi,deck\ndi,ดี,di,ดี,mid,tốt; hay,bai-01\nma,มา,ma,มา,mid,đến,bai-01\n',
};

let dir: string;
async function setup(files: Record<string, string> = FILES) {
  dir = await mkdtemp(path.join(tmpdir(), 'nom-build-'));
  for (const [rel, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, 'content', rel)), { recursive: true });
    await writeFile(path.join(dir, 'content', rel), text, 'utf8');
  }
  const { content } = await loadContent(path.join(dir, 'content'));
  return { content, out: path.join(dir, 'out') };
}
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

const readJson = async <T>(file: string) => JSON.parse(await readFile(file, 'utf8')) as T;

describe('buildContent', () => {
  it('xuất mỗi loại một JSON (chỉ giá trị đã parse, giữ thứ tự nguồn) + manifest', async () => {
    const { content, out } = await setup();
    const { manifest, written } = await buildContent(content, out);

    expect((await readdir(out)).sort()).toEqual(
      [
        'consonants.json',
        'decks.json',
        'manifest.json',
        'minimal-pairs.json',
        'readings.json',
        'tone-drills.json',
        'tone-marks.json',
        'tones.json',
        'vowels.json',
        'words.json',
      ].sort(),
    );
    expect(written).toHaveLength(10);
    const words = await readJson<{ id: string; meaning_vi: string[] }[]>(path.join(out, 'words.json'));
    expect(words.map((w) => w.id)).toEqual(['di', 'ma']);
    expect(words[0]!.meaning_vi).toEqual(['tốt', 'hay']);
    expect(words[0]).not.toHaveProperty('file');

    const onDisk = await readJson<Manifest>(path.join(out, 'manifest.json'));
    expect(onDisk).toEqual(manifest);
    expect(manifest.files.words).toMatchObject({ file: 'words.json', count: 2 });
    expect(manifest.files.decks.count).toBe(1);
    expect(manifest.files.vowels.count).toBe(0);
    expect(manifest.version).toMatch(/^[0-9a-f]{16}$/);
  });

  it('idempotent: chạy lần 2 không ghi gì, byte giống hệt', async () => {
    const { content, out } = await setup();
    await buildContent(content, out);
    const before = await readFile(path.join(out, 'manifest.json'), 'utf8');
    const mtime = (await stat(path.join(out, 'words.json'))).mtimeMs;

    const again = await buildContent(content, out);
    expect(again.written).toEqual([]);
    expect(await readFile(path.join(out, 'manifest.json'), 'utf8')).toBe(before);
    expect((await stat(path.join(out, 'words.json'))).mtimeMs).toBe(mtime);
  });

  it('đổi content → chỉ file liên quan + manifest được ghi, version đổi', async () => {
    const first = await setup();
    const { manifest: m1 } = await buildContent(first.content, first.out);
    const { content } = await loadContent(path.join(dir, 'content'));
    content.words.pop();
    const { manifest: m2, written } = await buildContent(content, first.out);
    expect(written).toEqual(['words.json', 'manifest.json']);
    expect(m2.version).not.toBe(m1.version);
    expect(m2.files.decks.hash).toBe(m1.files.decks.hash);
  });

  it('xoá JSON cũ không còn tương ứng, giữ file khác', async () => {
    const { content, out } = await setup();
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, 'cu.json'), '{}');
    await writeFile(path.join(out, 'README.txt'), 'x');
    const { removed } = await buildContent(content, out);
    expect(removed).toEqual(['cu.json']);
    expect(await readdir(out)).toContain('README.txt');
  });
});
