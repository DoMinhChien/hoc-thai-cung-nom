/**
 * Logic của `pnpm content:check` (tách khỏi entry để test được).
 *
 *   content:check                         validate toàn bộ content/
 *   content:check --input <file|thư mục>  validate file staging của pipeline Python (plan 5.3 bước 5);
 *                                         content/ làm ngữ cảnh (deck, lexicon, id trùng), chỉ báo issue của input
 *   --json                                in JSON ra stdout cho Python đọc
 *
 * Lỗi → exit 1; chỉ có cảnh báo → exit 0; tham số sai → exit 2.
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { checkContent } from './check';
import {
  detectKind,
  formatIssue,
  loadContent,
  loadFile,
  type ContentIssue,
  type ContentKind,
  type ContentSet,
} from './load';

export interface CheckReport {
  ok: boolean;
  items: number;
  errors: number;
  warnings: number;
  issues: ContentIssue[];
}

export interface RunOptions {
  /** Thư mục người dùng gõ lệnh (đường dẫn `--input` tính từ đây; hiển thị tương đối với đây). */
  cwd: string;
  /** Thư mục `content/`. */
  contentRoot: string;
}

export interface RunResult {
  exitCode: number;
  stdout: string[];
  stderr: string[];
}

export async function runCheck(argv: string[], options: RunOptions): Promise<RunResult> {
  let args: { input: string[]; json: boolean };
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        input: { type: 'string', multiple: true, default: [] },
        json: { type: 'boolean', default: false },
      },
      strict: true,
    });
    args = { input: values.input, json: values.json };
  } catch (e) {
    return { exitCode: 2, stdout: [], stderr: [(e as Error).message] };
  }

  const report =
    args.input.length > 0
      ? await checkInputs(args.input, options)
      : await checkAll(options);

  if (args.json) {
    return { exitCode: report.ok ? 0 : 1, stdout: [JSON.stringify(report, null, 2)], stderr: [] };
  }
  const summary = `content:check — ${report.items} mục, ${report.errors} lỗi, ${report.warnings} cảnh báo.`;
  return {
    exitCode: report.ok ? 0 : 1,
    stdout: [summary],
    stderr: report.issues.map(formatIssue),
  };
}

async function checkAll({ cwd, contentRoot }: RunOptions): Promise<CheckReport> {
  const { content, issues } = await loadContent(contentRoot, { cwd });
  return toReport(countItems(content), [...issues, ...checkContent(content)]);
}

async function checkInputs(inputs: string[], { cwd, contentRoot }: RunOptions) {
  const { content } = await loadContent(contentRoot, { cwd });
  const issues: ContentIssue[] = [];
  const inputFiles = new Set<string>();
  let items = 0;

  for (const input of inputs) {
    const target = path.resolve(cwd, input);
    const files = await listFiles(target);
    if (files === null) {
      issues.push({ severity: 'error', file: input, message: 'không tìm thấy file/thư mục' });
      continue;
    }
    for (const file of files) {
      const kind = detectKind(file);
      if (!kind) {
        if (files.length === 1) {
          issues.push({
            severity: 'error',
            file: input,
            message: 'không nhận ra loại nội dung từ tên file (vd. words.<nguồn>.csv)',
          });
        }
        continue;
      }
      const result = await loadFile(file, kind, { cwd });
      (content[kind] as unknown[]).push(...result.items);
      issues.push(...result.issues);
      items += result.items.length;
      for (const item of result.items) inputFiles.add(item.file);
      for (const issue of result.issues) inputFiles.add(issue.file);
    }
  }
  // Kiểm tra chéo trên content/ + input, nhưng chỉ báo phần thuộc input.
  const cross = checkContent(content).filter((i) => inputFiles.has(i.file));
  return toReport(items, [...issues, ...cross]);
}

/** File → [file]; thư mục → mọi file bên trong (đệ quy, sắp xếp); không tồn tại → null. */
async function listFiles(target: string): Promise<string[] | null> {
  const info = await stat(target).catch(() => null);
  if (!info) return null;
  if (info.isFile()) return [target];
  const entries = await readdir(target, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
    .sort();
}

function countItems(content: ContentSet) {
  return (Object.keys(content) as ContentKind[]).reduce((n, k) => n + content[k].length, 0);
}

function toReport(items: number, issues: ContentIssue[]): CheckReport {
  const sorted = [...issues].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      (a.line ?? 0) - (b.line ?? 0) ||
      (a.column ?? 0) - (b.column ?? 0),
  );
  const errors = sorted.filter((i) => i.severity === 'error').length;
  return { ok: errors === 0, items, errors, warnings: sorted.length - errors, issues: sorted };
}
