/**
 * `pnpm content:build` — validate rồi xuất `content/` → `apps/web/public/content/*.json` + manifest.
 * Có lỗi validate → exit 1, không ghi gì. Web build/dev chạy lệnh này trước.
 */
import path from 'node:path';
import { buildContent } from './content/build';
import { checkContent } from './content/check';
import { formatIssue, loadContent } from './content/load';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'apps/web/public/content');

const { content, issues } = await loadContent(path.join(REPO_ROOT, 'content'), { cwd: REPO_ROOT });
const errors = [...issues, ...checkContent(content)].filter((i) => i.severity === 'error');

if (errors.length > 0) {
  for (const issue of errors) console.error(formatIssue(issue));
  console.error(
    `content:build — ${errors.length} lỗi, không xuất. Chạy pnpm content:check để xem.`,
  );
  process.exitCode = 1;
} else {
  const { manifest, written, removed } = await buildContent(content, OUT_DIR);
  const changes = [...written, ...removed.map((f) => `-${f}`)];
  console.log(
    `content:build — version ${manifest.version}; ${changes.length ? changes.join(', ') : 'không đổi'}.`,
  );
}
