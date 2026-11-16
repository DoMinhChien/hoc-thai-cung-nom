/**
 * Loader nội dung (plan 5.4): đọc YAML + CSV trong `content/`, chuẩn hóa chữ Thái bằng
 * `normalizeThai`, parse bằng schema của `@nom/core`. Mọi lỗi kèm file + dòng/cột + trường.
 * Cách tổ chức học theo LibreLingo (loader tách khỏi validator/exporter — plan 7.5).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseCsv, CsvError } from 'csv-parse/sync';
import { isMap, isSeq, LineCounter, parseDocument, type Document, type Node } from 'yaml';
import type { z } from 'zod';
import {
  ConsonantSchema,
  DeckSchema,
  MinimalPairSchema,
  normalizeThai,
  ReadingSchema,
  SyllableAnalysisSchema,
  ToneEntrySchema,
  ToneMarkEntrySchema,
  VowelSchema,
  WordRowSchema,
} from '@nom/core';

/** Loại file nội dung → schema của từng mục. */
export const CONTENT_KINDS = {
  consonants: ConsonantSchema,
  vowels: VowelSchema,
  toneMarks: ToneMarkEntrySchema,
  tones: ToneEntrySchema,
  toneDrills: SyllableAnalysisSchema,
  decks: DeckSchema,
  words: WordRowSchema,
  readings: ReadingSchema,
  minimalPairs: MinimalPairSchema,
} as const;

export type ContentKind = keyof typeof CONTENT_KINDS;
export type ContentItem<K extends ContentKind> = z.output<(typeof CONTENT_KINDS)[K]>;

/** Vị trí file chuẩn trong `content/` (plan 5.4). `readings` là cả thư mục, mỗi file một bài. */
export const CONTENT_FILES: Record<Exclude<ContentKind, 'readings'>, string> = {
  consonants: 'alphabet/consonants.yaml',
  vowels: 'alphabet/vowels.yaml',
  toneMarks: 'alphabet/tone-marks.yaml',
  tones: 'alphabet/tones.yaml',
  toneDrills: 'alphabet/tone-drills.yaml',
  decks: 'vocab/decks.yaml',
  words: 'vocab/words.csv',
  minimalPairs: 'listening/minimal-pairs.yaml',
};
export const READINGS_DIR = 'readings';

export interface ContentIssue {
  severity: 'error' | 'warning';
  /** Đường dẫn hiển thị (dấu `/`). */
  file: string;
  /** Dòng/cột bắt đầu từ 1. */
  line?: number;
  column?: number;
  /** Trường trong mục, vd. `tones.1`; mục thứ mấy nằm ở `line`. */
  field?: string;
  message: string;
}

/** Một mục đã parse, kèm vị trí để validator (T3.2) báo lỗi chéo (id trùng, deck thiếu…). */
export interface Located<T> {
  value: T;
  file: string;
  line: number;
}

export type ContentSet = { [K in ContentKind]: Located<ContentItem<K>>[] };

export interface LoadResult {
  content: ContentSet;
  issues: ContentIssue[];
}

export interface LoadOptions {
  /** Thư mục gốc để hiển thị đường dẫn tương đối; mặc định `process.cwd()`. */
  cwd?: string;
}

export function emptyContentSet(): ContentSet {
  return {
    consonants: [],
    vowels: [],
    toneMarks: [],
    tones: [],
    toneDrills: [],
    decks: [],
    words: [],
    readings: [],
    minimalPairs: [],
  };
}

/**
 * Đoán loại file theo tên (dùng cho `--input` file staging của pipeline Python, M4):
 * `words.<pdf>.csv` → words, `consonants.yaml` → consonants, file trong `readings/` → readings.
 */
export function detectKind(file: string): ContentKind | null {
  const base = path.basename(file).toLowerCase();
  const stem = base.split('.')[0]!;
  const ext = path.extname(base);
  if (ext === '.csv') return stem === 'words' ? 'words' : null;
  if (ext !== '.yaml' && ext !== '.yml') return null;
  for (const [kind, rel] of Object.entries(CONTENT_FILES)) {
    if (path.basename(rel).split('.')[0] === stem) return kind as ContentKind;
  }
  if (path.basename(path.dirname(file)) === READINGS_DIR) return 'readings';
  return null;
}

/** Đọc toàn bộ `content/`. File chuẩn nào chưa có thì coi như rỗng (validator quyết định). */
export async function loadContent(root: string, options: LoadOptions = {}): Promise<LoadResult> {
  const content = emptyContentSet();
  const issues: ContentIssue[] = [];
  const show = displayPath(options.cwd);

  if (!(await isDirectory(root))) {
    issues.push({ severity: 'error', file: show(root), message: 'không tìm thấy thư mục content' });
    return { content, issues };
  }

  for (const [kind, rel] of Object.entries(CONTENT_FILES) as [ContentKind, string][]) {
    const file = path.join(root, rel);
    if (await isFile(file)) mergeInto(content, issues, kind, await loadFile(file, kind, options));
  }

  const readingsDir = path.join(root, READINGS_DIR);
  if (await isDirectory(readingsDir)) {
    const names = (await readdir(readingsDir)).filter((n) => /\.ya?ml$/i.test(n)).sort();
    for (const name of names) {
      const file = path.join(readingsDir, name);
      mergeInto(content, issues, 'readings', await loadFile(file, 'readings', options));
    }
  }
  return { content, issues };
}

export interface FileResult<K extends ContentKind> {
  items: Located<ContentItem<K>>[];
  issues: ContentIssue[];
}

/** Đọc một file theo loại cho trước. */
export async function loadFile<K extends ContentKind>(
  file: string,
  kind: K,
  options: LoadOptions = {},
): Promise<FileResult<K>> {
  const shown = displayPath(options.cwd)(file);
  const text = await readFile(file, 'utf8');
  return kind === 'words'
    ? (loadCsv(text, shown) as FileResult<K>)
    : loadYaml(text, shown, kind, kind !== 'readings');
}

function loadYaml<K extends ContentKind>(
  text: string,
  file: string,
  kind: K,
  isList: boolean,
): FileResult<K> {
  const schema = CONTENT_KINDS[kind];
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter, prettyErrors: true });
  const at = (offset: number) => lineCounter.linePos(offset);
  const items: Located<ContentItem<K>>[] = [];
  const issues: ContentIssue[] = [];

  for (const [severity, list] of [
    ['error', doc.errors],
    ['warning', doc.warnings],
  ] as const) {
    for (const e of list) {
      const pos = e.linePos?.[0];
      issues.push({
        severity,
        file,
        line: pos?.line,
        column: pos?.col,
        message: `YAML: ${e.message.split('\n')[0]}`,
      });
    }
  }
  if (doc.errors.length > 0) return { items, issues };

  const root = doc.contents;
  if (root === null) return { items, issues };
  if (isList ? !isSeq(root) : !isMap(root)) {
    const pos = root.range ? at(root.range[0]) : undefined;
    issues.push({
      severity: 'error',
      file,
      line: pos?.line,
      column: pos?.col,
      message: isList ? 'file phải là danh sách mục (- ...)' : 'file phải là một mục (key: value)',
    });
    return { items, issues };
  }

  const entries: { prefix: (string | number)[]; node: Node }[] = isSeq(root)
    ? root.items.map((node, i) => ({ prefix: [i], node: node as Node }))
    : [{ prefix: [], node: root }];

  for (const { prefix, node } of entries) {
    const start = at(node.range?.[0] ?? 0);
    const result = schema.safeParse(normalizeStrings(node.toJSON()));
    if (result.success) {
      items.push({ value: result.data as ContentItem<K>, file, line: start.line });
      continue;
    }
    for (const issue of result.error.issues) {
      const pos = locate(doc, [...prefix, ...issue.path], at) ?? start;
      issues.push({
        severity: 'error',
        file,
        line: pos.line,
        column: pos.col,
        field: fieldOf(issue),
        message: issue.message,
      });
    }
  }
  return { items, issues };
}

/** Vị trí node sâu nhất tồn tại trên `path` (trường thiếu → báo ở mục chứa nó). */
function locate(
  doc: Document,
  fullPath: PropertyKey[],
  at: (offset: number) => { line: number; col: number },
) {
  for (let n = fullPath.length; n > 0; n--) {
    const node = doc.getIn(fullPath.slice(0, n), true) as Node | undefined;
    if (node?.range) return at(node.range[0]);
  }
  return undefined;
}

function loadCsv(text: string, file: string): FileResult<'words'> {
  const items: Located<ContentItem<'words'>>[] = [];
  const issues: ContentIssue[] = [];
  let records: { record: Record<string, string>; info: { lines: number } }[];
  try {
    records = parseCsv(text, { columns: true, bom: true, skip_empty_lines: true, info: true });
  } catch (e) {
    if (!(e instanceof CsvError)) throw e;
    const line = (e as CsvError & { lines?: number }).lines;
    issues.push({ severity: 'error', file, line, message: `CSV: ${e.message}` });
    return { items, issues };
  }

  for (const { record, info } of records) {
    // info.lines = dòng cuối của bản ghi; ô nhiều dòng hiếm gặp trong words.csv.
    const line = info.lines;
    const result = WordRowSchema.safeParse(normalizeStrings(record));
    if (result.success) {
      items.push({ value: result.data, file, line });
      continue;
    }
    for (const issue of result.error.issues) {
      issues.push({ severity: 'error', file, line, field: fieldOf(issue), message: issue.message });
    }
  }
  return { items, issues };
}

/** Chuẩn hóa mọi chuỗi (Thái: thứ tự dấu, ำ, ký tự vô hình; mọi chuỗi: NFC). */
export function normalizeStrings(value: unknown): unknown {
  if (typeof value === 'string') return normalizeThai(value);
  if (Array.isArray(value)) return value.map(normalizeStrings);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeStrings(v)] as const),
    );
  }
  return value;
}

function fieldOf(issue: z.core.$ZodIssue): string | undefined {
  if (issue.path.length > 0) return issue.path.map(String).join('.');
  if (issue.code === 'unrecognized_keys') return issue.keys.join(', ');
  return undefined;
}

function mergeInto<K extends ContentKind>(
  content: ContentSet,
  issues: ContentIssue[],
  kind: K,
  result: FileResult<K>,
) {
  (content[kind] as Located<ContentItem<K>>[]).push(...result.items);
  issues.push(...result.issues);
}

function displayPath(cwd = process.cwd()) {
  return (file: string) => path.relative(cwd, file).split(path.sep).join('/') || '.';
}

async function isFile(p: string) {
  return (await stat(p).catch(() => null))?.isFile() ?? false;
}

async function isDirectory(p: string) {
  return (await stat(p).catch(() => null))?.isDirectory() ?? false;
}

/** `file:line:col [field] message` — định dạng chuẩn cho terminal/CI. */
export function formatIssue(issue: ContentIssue): string {
  const loc = [issue.file, issue.line, issue.line && issue.column].filter(Boolean).join(':');
  const field = issue.field ? ` [${issue.field}]` : '';
  const tag = issue.severity === 'error' ? 'lỗi' : 'cảnh báo';
  return `${loc} ${tag}${field}: ${issue.message}`;
}
