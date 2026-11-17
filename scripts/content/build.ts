/**
 * `content:build` v7 (T6.5): content đã validate → `apps/web/public/content/`:
 * - `units.json`: lộ trình (unit theo `order`, kèm bài + số từ/câu) cho `/units` (P-10);
 * - `unit-<unit_id>.json`: mọi thứ của một unit (bài, từ, câu, mẫu câu, hội thoại) — tải khi mở unit;
 * - `manifest.json`: hash từng file + version gộp.
 * Output ổn định: cùng content → cùng byte (thứ tự trường theo schema), file không đổi thì không ghi lại.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Dialogue, Grammar, Lesson, Sentence, Unit, Word } from '@nom/core';
import type { ContentSet } from './load';

export const UNITS_FILE = 'units.json';
export const MANIFEST_FILE = 'manifest.json';
export const unitFile = (unitId: string) => `unit-${unitId}.json`;

export interface LessonSummary extends Lesson {
  words: number;
  sentences: number;
}

export interface UnitSummary extends Unit {
  lessons: LessonSummary[];
  words: number;
  sentences: number;
}

export interface UnitBundle {
  unit: Unit;
  lessons: Lesson[];
  words: Word[];
  sentences: Sentence[];
  grammar: Grammar[];
  dialogues: Dialogue[];
}

export interface ManifestEntry {
  /** sha256 (16 ký tự hex đầu) của nội dung file — dùng để cache/so phiên bản. */
  hash: string;
  /** Số unit (units.json) hoặc số mục (unit-*.json). */
  count: number;
}

export interface Manifest {
  /** Hash gộp của mọi file — đổi khi bất kỳ nội dung nào đổi. */
  version: string;
  files: Record<string, ManifestEntry>;
}

export interface BuildResult {
  manifest: Manifest;
  /** File đã ghi (mới hoặc đổi); rỗng nếu output đã cập nhật. */
  written: string[];
  removed: string[];
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const toJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const byOrder = <T extends { order: number }>(items: T[], id: (item: T) => string) =>
  [...items].sort((a, b) => a.order - b.order || id(a).localeCompare(id(b)));

/** Gom content theo unit (giữ thứ tự nguồn cho từ/câu/mẫu câu/hội thoại). */
export function bundleUnits(content: ContentSet): UnitBundle[] {
  const values = <T>(items: { value: T }[]) => items.map((i) => i.value);
  const lessons = values(content.lessons);
  const lessonUnit = new Map(lessons.map((l) => [l.lesson_id, l.unit_id]));

  return byOrder(values(content.units), (u) => u.unit_id).map((unit) => {
    const inUnit = <T extends { unit_id: string }>(items: T[]) =>
      items.filter((i) => i.unit_id === unit.unit_id);
    return {
      unit,
      lessons: byOrder(inUnit(lessons), (l) => l.lesson_id),
      words: inUnit(values(content.words)),
      sentences: inUnit(values(content.sentences)),
      grammar: inUnit(values(content.grammar)),
      dialogues: values(content.dialogues).filter(
        (d) => lessonUnit.get(d.lesson_id) === unit.unit_id,
      ),
    };
  });
}

export function summarize(bundle: UnitBundle): UnitSummary {
  const countIn = (items: { lesson_id: string }[], lessonId: string) =>
    items.filter((i) => i.lesson_id === lessonId).length;
  return {
    ...bundle.unit,
    lessons: bundle.lessons.map((l) => ({
      ...l,
      words: countIn(bundle.words, l.lesson_id),
      sentences: countIn(bundle.sentences, l.lesson_id),
    })),
    words: bundle.words.length,
    sentences: bundle.sentences.length,
  };
}

export async function buildContent(content: ContentSet, outDir: string): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });
  const bundles = bundleUnits(content);
  const outputs = new Map<string, string>();
  const files: Record<string, ManifestEntry> = {};
  const add = (file: string, value: unknown, count: number) => {
    const text = toJson(value);
    outputs.set(file, text);
    files[file] = { hash: hash(text), count };
  };

  add(UNITS_FILE, bundles.map(summarize), bundles.length);
  for (const b of bundles) {
    const count =
      1 +
      b.lessons.length +
      b.words.length +
      b.sentences.length +
      b.grammar.length +
      b.dialogues.length;
    add(unitFile(b.unit.unit_id), b, count);
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

  // Thư mục output do build quản lý hoàn toàn: xoá JSON cũ không còn tương ứng
  // (vd. consonants.json, words.json của M3; unit đã bỏ).
  const removed: string[] = [];
  for (const name of (await readdir(outDir)).sort()) {
    if (name.endsWith('.json') && !outputs.has(name)) {
      await rm(path.join(outDir, name));
      removed.push(name);
    }
  }
  return { manifest, written, removed };
}
