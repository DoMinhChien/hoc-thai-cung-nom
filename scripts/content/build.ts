/**
 * `content:build` (T3.4): content đã validate → `apps/web/public/content/<loại>.json` + `manifest.json`.
 * Output ổn định: cùng content → cùng byte (thứ tự mục giữ như file nguồn, thứ tự trường theo schema),
 * file không đổi thì không ghi lại.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentKind, ContentSet } from './load';

/** Tên file JSON theo loại (kebab-case như tên file nguồn). */
export const OUTPUT_FILES: Record<ContentKind, string> = {
  consonants: 'consonants.json',
  vowels: 'vowels.json',
  toneMarks: 'tone-marks.json',
  tones: 'tones.json',
  toneDrills: 'tone-drills.json',
  decks: 'decks.json',
  words: 'words.json',
  readings: 'readings.json',
  minimalPairs: 'minimal-pairs.json',
};
export const MANIFEST_FILE = 'manifest.json';

export interface ManifestEntry {
  file: string;
  /** sha256 (16 ký tự hex đầu) của nội dung file — dùng để cache/so phiên bản. */
  hash: string;
  count: number;
}

export interface Manifest {
  /** Hash gộp của mọi file — đổi khi bất kỳ nội dung nào đổi. */
  version: string;
  files: Record<ContentKind, ManifestEntry>;
}

export interface BuildResult {
  manifest: Manifest;
  /** File đã ghi (mới hoặc đổi); rỗng nếu output đã cập nhật. */
  written: string[];
  removed: string[];
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const toJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

export async function buildContent(content: ContentSet, outDir: string): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });
  const outputs = new Map<string, string>();
  const files = {} as Record<ContentKind, ManifestEntry>;

  for (const kind of Object.keys(OUTPUT_FILES) as ContentKind[]) {
    const text = toJson(content[kind].map((item) => item.value));
    const file = OUTPUT_FILES[kind];
    outputs.set(file, text);
    files[kind] = { file, hash: hash(text), count: content[kind].length };
  }
  const version = hash(
    Object.values(files)
      .map((f) => f.hash)
      .join(''),
  );
  const manifest: Manifest = { version, files };
  outputs.set(MANIFEST_FILE, toJson(manifest));

  const written: string[] = [];
  for (const [file, text] of outputs) {
    const target = path.join(outDir, file);
    const current = await readFile(target, 'utf8').catch(() => null);
    if (current === text) continue;
    await writeFile(target, text, 'utf8');
    written.push(file);
  }

  // Thư mục output do build quản lý hoàn toàn: xoá JSON cũ không còn tương ứng.
  const removed: string[] = [];
  for (const name of await readdir(outDir)) {
    if (name.endsWith('.json') && !outputs.has(name)) {
      await rm(path.join(outDir, name));
      removed.push(name);
    }
  }
  return { manifest, written, removed };
}
