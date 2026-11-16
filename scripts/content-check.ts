/**
 * `pnpm content:check [--input <file|thư mục>] [--json]` — validate nội dung (plan 5.6, 5.3 bước 5).
 * Chi tiết tham số: `content/cli.ts`.
 */
import path from 'node:path';
import { runCheck } from './content/cli';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

// pnpm --filter chạy script trong scripts/; INIT_CWD là thư mục người dùng gõ lệnh.
const result = await runCheck(process.argv.slice(2), {
  cwd: process.env.INIT_CWD ?? process.cwd(),
  contentRoot: path.join(REPO_ROOT, 'content'),
});
for (const line of result.stderr) console.error(line);
for (const line of result.stdout) console.log(line);
process.exitCode = result.exitCode;
