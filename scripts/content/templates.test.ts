import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCheck, type CheckReport } from './cli';
import { CONTENT_FILES, CONTENT_KINDS, loadContent, type ContentKind } from './load';

// T6.2: content/templates/ là mẫu cho giáo viên — phải khớp schema và tự kiểm tra được.
const REPO = path.resolve(import.meta.dirname, '../..');
const TEMPLATES = path.join(REPO, 'content/templates');
const CSV_KINDS = (Object.keys(CONTENT_FILES) as ContentKind[]).filter((k) =>
  CONTENT_FILES[k].endsWith('.csv'),
);

describe('content/templates/', () => {
  it.each(CSV_KINDS)('%s: header đúng thứ tự và đủ mọi cột của schema', async (kind) => {
    const text = await readFile(path.join(TEMPLATES, CONTENT_FILES[kind]), 'utf8');
    const header = text.split('\n')[0]!.split(',');
    expect(header).toEqual(Object.keys(CONTENT_KINDS[kind].shape));
  });

  it('có đủ 6 file, mỗi file đúng 1 mục ví dụ hợp lệ', async () => {
    const { content, issues } = await loadContent(TEMPLATES, { cwd: REPO });
    expect(issues).toEqual([]);
    for (const kind of Object.keys(CONTENT_FILES) as ContentKind[]) {
      expect(content[kind], kind).toHaveLength(1);
    }
  });

  it('dòng ví dụ tham chiếu lẫn nhau → content:check 0 lỗi', async () => {
    const result = await runCheck(['--json'], { cwd: REPO, contentRoot: TEMPLATES });
    const report = JSON.parse(result.stdout.join('\n')) as CheckReport;
    expect(report.issues.filter((i) => i.severity === 'error')).toEqual([]);
  });
});
