import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCheck, type CheckReport } from './cli';

// Mẫu tối thiểu chỉ để test CLI — không phải nội dung học.
const WORDS_HEADER = 'id,unit_id,lesson_id,thai,meaning_vi';
const csv = (...lines: string[]) => `${lines.join('\n')}\n`;
const CONTENT = {
  'content/units.csv': csv('unit_id,level,order,title_vi,can_do', 'u01,A1,1,Chào hỏi,Chào hỏi'),
  'content/lessons.csv': csv(
    'lesson_id,unit_id,order,title_vi',
    'u01-l1,u01,1,Bài 1',
    'u01-l2,u01,2,Bài 2',
    'u01-l3,u01,3,Bài 3',
  ),
  'content/words.csv': csv(
    WORDS_HEADER,
    ...Array.from({ length: 8 }, (_, i) => `w${i},u01,u01-l1,ดี,tốt`),
  ),
};
/** Bài 2, 3 chưa có từ → 2 cảnh báo "bài có 0 từ" có sẵn. */
const BASE_WARNINGS = 2;

let dir: string;
async function tree(files: Record<string, string>) {
  dir = await mkdtemp(path.join(tmpdir(), 'nom-cli-'));
  for (const [rel, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
    await writeFile(path.join(dir, rel), text, 'utf8');
  }
  return { cwd: dir, contentRoot: path.join(dir, 'content') };
}
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

const json = (stdout: string[]) => JSON.parse(stdout.join('\n')) as CheckReport;
const REPO = path.resolve(import.meta.dirname, '../..');

describe('content:check', () => {
  it('content hợp lệ → exit 0, tóm tắt ra stdout', async () => {
    const result = await runCheck([], await tree(CONTENT));
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toEqual([`content:check — 12 mục, 0 lỗi, ${BASE_WARNINGS} cảnh báo.`]);
  });

  it('có lỗi → exit 1, mỗi issue một dòng file:dòng ra stderr', async () => {
    const opts = await tree({
      ...CONTENT,
      'content/sentences.csv': csv(
        'id,unit_id,lesson_id,vi,th,tokens',
        's1,u01,u01-l9,Tốt.,ดี,ดี',
        's2,u01,u01-l1,Tốt lắm.,ดีมาก,ดี',
      ),
    });
    const result = await runCheck([], opts);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.filter((l) => l.includes(' lỗi '))).toEqual([
      'content/sentences.csv:2 lỗi [lesson_id]: bài "u01-l9" không có trong lessons.csv',
      'content/sentences.csv:3 lỗi [tokens]: tokens ghép lại là "ดี", không khớp th "ดีมาก"',
    ]);
  });

  it('chỉ có cảnh báo → exit 0', async () => {
    const opts = await tree({
      ...CONTENT,
      'content/units.csv': csv('unit_id,level,order,title_vi,can_do,draft', 'u01,A1,1,A,x,true'),
    });
    const result = await runCheck(['--json'], opts);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout)).toMatchObject({
      ok: true,
      errors: 0,
      warnings: BASE_WARNINGS + 1,
    });
  });

  it('tham số lạ → exit 2', async () => {
    const result = await runCheck(['--inptu', 'x'], await tree(CONTENT));
    expect(result.exitCode).toBe(2);
    expect(result.stderr[0]).toMatch(/inptu/);
  });
});

describe('--input (file staging của pipeline Python)', () => {
  it('validate file staging với content/ làm ngữ cảnh; chỉ báo issue của input', async () => {
    const opts = await tree({
      ...CONTENT,
      // Lỗi có sẵn trong content/ không được báo khi chạy --input.
      'content/grammar.yaml':
        '- { id: g1, unit_id: u09, title_vi: A, pattern: x, explain_vi: x, examples: [{ th: ดี, vi: tốt }] }\n',
      'staging/words.sach-a.csv': csv(
        WORDS_HEADER,
        'ma,u01,u01-l2,มา,đến',
        'w0,u01,u01-l2,ดี,tốt',
        'kin,u02,u01-l2,กิน,ăn',
      ),
    });
    const result = await runCheck(['--input', 'staging/words.sach-a.csv', '--json'], opts);
    const report = json(result.stdout);
    expect(result.exitCode).toBe(1);
    expect(report.items).toBe(3);
    expect(report.issues.map((i) => [i.file, i.line, i.field])).toEqual([
      ['staging/words.sach-a.csv', 3, 'id'],
      ['staging/words.sach-a.csv', 4, 'unit_id'],
      ['staging/words.sach-a.csv', 4, 'lesson_id'],
    ]);
    expect(report.issues[0]!.message).toContain('content/words.csv:2');
  });

  it('thư mục → mọi file nhận dạng được (đệ quy), bỏ qua file khác', async () => {
    const opts = await tree({
      ...CONTENT,
      'staging/words.a.csv': csv(WORDS_HEADER, 'ma,u01,u01-l2,มา,đến'),
      'staging/sub/sentences.a.csv': csv(
        'id,unit_id,lesson_id,vi,th,tokens,distractors',
        's1,u01,u01-l2,Đến.,มา,มา,มา',
      ),
      'staging/report.txt': 'bỏ qua',
    });
    const report = json((await runCheck(['--input', 'staging', '--json'], opts)).stdout);
    expect(report.items).toBe(2);
    expect(report.issues).toEqual([
      expect.objectContaining({ file: 'staging/sub/sentences.a.csv', field: 'distractors.0' }),
    ]);
  });

  it('nhiều --input; file không tồn tại hoặc không nhận dạng được → lỗi', async () => {
    const opts = await tree({ ...CONTENT, 'staging/la.csv': csv('a', '1') });
    const result = await runCheck(
      ['--input', 'staging/khong-co.csv', '--input', 'staging/la.csv'],
      opts,
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toEqual([
      'staging/khong-co.csv lỗi: không tìm thấy file/thư mục',
      'staging/la.csv lỗi: không nhận ra loại nội dung từ tên file (vd. words.<nguồn>.csv, grammar.<nguồn>.yaml)',
    ]);
  });
});

describe('content/ thật của repo', () => {
  it('không có lỗi (chỉ cảnh báo) — chặn content hỏng lọt vào main', async () => {
    const result = await runCheck(['--json'], {
      cwd: REPO,
      contentRoot: path.join(REPO, 'content'),
    });
    const report = json(result.stdout);
    expect(report.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(report.items).toBeGreaterThan(0);
  });
});
