/**
 * `content:build` v7 (T6.5): content đã validate → `apps/web/public/content/`:
 * - `units.json`: lộ trình (unit theo `order`, kèm bài + số từ/câu) cho `/units` (P-10);
 * - `unit-<unit_id>.json`: mọi thứ của một unit (bài, từ, câu, mẫu câu, hội thoại) — tải khi mở unit;
 * - `manifest.json`: hash từng file + version gộp.
 * v7.1 (plan 0.11 #3, #5): câu có `th` mà `tokens` trống → tự tách bằng `Intl.Segmenter('th')`, gắn
 * `auto_tokens: true`; mỗi bài có `steps` = các bước có dữ liệu (unit `grammar`: Mẫu câu trước Từ vựng).
 * Kiểu/schema JSON output nằm ở `@nom/core` (`content/bundle.ts`) — web đọc lại bằng chính schema đó.
 * Output ổn định: cùng content → cùng byte (thứ tự trường theo schema), file không đổi thì không ghi lại.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  MANIFEST_FILE,
  UNITS_FILE,
  unitFile,
  type BuiltSentence,
  type LessonStep,
  type Manifest,
  type ManifestEntry,
  type Sentence,
  type Unit,
  type UnitBundle,
  type UnitSummary,
  type Lesson,
} from '@nom/core';
import type { ContentSet } from './load';

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

const segmenter = new Intl.Segmenter('th', { granularity: 'word' });

/** Tách câu Thái thành từ (bỏ khoảng trắng, dấu câu) — dùng khi giáo viên chưa điền `tokens`. */
export function segmentThai(text: string): string[] {
  return [...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment);
}

export function withTokens(sentence: Sentence): BuiltSentence {
  if (sentence.th === undefined || sentence.tokens.length > 0) return sentence;
  return { ...sentence, tokens: segmentThai(sentence.th), auto_tokens: true };
}

const STEP_ORDER: Record<Unit['kind'], LessonStep[]> = {
  theme: ['vocab', 'grammar', 'dialogue', 'exercise'],
  grammar: ['grammar', 'vocab', 'dialogue', 'exercise'],
};

/** Gom content theo unit (giữ thứ tự nguồn cho từ/câu/mẫu câu/hội thoại). */
export function bundleUnits(content: ContentSet): UnitBundle[] {
  const values = <T>(items: { value: T }[]) => items.map((i) => i.value);
  const lessons = values(content.lessons);
  const lessonUnit = new Map(lessons.map((l) => [l.lesson_id, l.unit_id]));

  return byOrder(values(content.units), (u) => u.unit_id).map((unit) => {
    const inUnit = <T extends { unit_id: string }>(items: T[]) =>
      items.filter((i) => i.unit_id === unit.unit_id);
    const words = inUnit(values(content.words));
    const sentences = inUnit(values(content.sentences)).map(withTokens);
    const dialogues = values(content.dialogues).filter(
      (d) => lessonUnit.get(d.lesson_id) === unit.unit_id,
    );
    const has = (lesson: Lesson): Record<LessonStep, boolean> => ({
      vocab: words.some((w) => w.lesson_id === lesson.lesson_id),
      grammar: lesson.grammar_ids.length > 0,
      dialogue: dialogues.some((d) => d.lesson_id === lesson.lesson_id),
      // Câu chưa có đáp án (draft) chưa làm bài tập được.
      exercise: sentences.some((s) => s.lesson_id === lesson.lesson_id && s.th !== undefined),
    });
    return {
      unit,
      lessons: byOrder(inUnit(lessons), (l) => l.lesson_id).map((l) => {
        const present = has(l);
        return { ...l, steps: STEP_ORDER[unit.kind].filter((step) => present[step]) };
      }),
      words,
      sentences,
      grammar: inUnit(values(content.grammar)),
      dialogues,
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
