/**
 * `pnpm content:check` — validate toàn bộ `content/` (plan 5.6).
 * Lỗi → exit 1; chỉ có cảnh báo → exit 0.
 */
import path from 'node:path';
import { checkContent } from './content/check';
import { formatIssue, loadContent, type ContentIssue } from './content/load';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_ROOT = path.join(REPO_ROOT, 'content');

function sortIssues(issues: ContentIssue[]): ContentIssue[] {
  return [...issues].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      (a.line ?? 0) - (b.line ?? 0) ||
      (a.column ?? 0) - (b.column ?? 0),
  );
}

const { content, issues: loadIssues } = await loadContent(CONTENT_ROOT, { cwd: REPO_ROOT });
const issues = sortIssues([...loadIssues, ...checkContent(content)]);
const errors = issues.filter((i) => i.severity === 'error').length;
const items = Object.values(content).reduce((n, list) => n + list.length, 0);

for (const issue of issues) {
  (issue.severity === 'error' ? console.error : console.warn)(formatIssue(issue));
}
console.log(`content:check — ${items} mục, ${errors} lỗi, ${issues.length - errors} cảnh báo.`);
process.exitCode = errors > 0 ? 1 : 0;
