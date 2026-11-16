import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCheck, type CheckReport } from './cli';

// Mẫu tối thiểu chỉ để test CLI — không phải nội dung học.
const HEADER = 'id,thai,phonetic,syllables,tones,meaning_vi,deck';
const CONTENT = {
  'content/vocab/decks.yaml': '- { id: bai-01, title_vi: Bài 1, order: 1 }\n',
  'content/vocab/words.csv': `${HEADER}\ndi,ดี,di,ดี,mid,tốt,bai-01\n`,
};

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

describe('content:check', () => {
  it('content hợp lệ → exit 0, tóm tắt ra stdout', async () => {
    const result = await runCheck([], await tree(CONTENT));
    expect(result).toEqual({
      exitCode: 0,
      stdout: ['content:check — 2 mục, 0 lỗi, 0 cảnh báo.'],
      stderr: [],
    });
  });

  it('có lỗi → exit 1, mỗi issue một dòng file:dòng ra stderr', async () => {
    const opts = await tree({
      ...CONTENT,
      'content/vocab/words.csv': `${HEADER}\ndi,ดี,di,ดี,mid,tốt,bai-09\n`,
    });
    const result = await runCheck([], opts);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toEqual([
      'content/vocab/words.csv:2 lỗi [deck]: deck "bai-09" không có trong vocab/decks.yaml',
    ]);
  });

  it('chỉ có cảnh báo → exit 0', async () => {
    const opts = await tree({
      ...CONTENT,
      'content/vocab/decks.yaml': '- { id: bai-01, title_vi: Bài 1, order: 1, draft: true }\n',
    });
    const result = await runCheck(['--json'], opts);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout)).toMatchObject({ ok: true, errors: 0, warnings: 1 });
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
      'content/alphabet/tones.yaml': '- { id: mid, label_vi: Ngang, chao: "99", order: 1 }\n',
      'staging/words.sach-a.csv': `${HEADER}\nma,มา,ma,มา,mid,đến,bai-01\ndi,ดี,di,ดี,mid,tốt,bai-01\nkin,กิน,kin,กิน,low|mid,ăn,bai-02\n`,
    });
    const result = await runCheck(['--input', 'staging/words.sach-a.csv', '--json'], opts);
    const report = json(result.stdout);
    expect(result.exitCode).toBe(1);
    expect(report.items).toBe(2);
    expect(report.issues.map((i) => [i.file, i.line, i.field])).toEqual([
      ['staging/words.sach-a.csv', 3, 'id'],
      ['staging/words.sach-a.csv', 4, 'tones'],
    ]);
    expect(report.issues[0]!.message).toContain('content/vocab/words.csv:2');
  });

  it('thư mục → mọi file nhận dạng được (đệ quy), bỏ qua file khác', async () => {
    const opts = await tree({
      ...CONTENT,
      'staging/words.a.csv': `${HEADER}\nma,มา,ma,มา,mid,đến,bai-01\n`,
      'staging/sub/tone-drills.a.yaml':
        '- { id: kha, thai: ขา, initial_char: ข, vowel_length: long, expected_tone: mid }\n',
      'staging/report.txt': 'bỏ qua',
    });
    const report = json((await runCheck(['--input', 'staging', '--json'], opts)).stdout);
    expect(report.items).toBe(2);
    expect(report.issues).toEqual([
      expect.objectContaining({ file: 'staging/sub/tone-drills.a.yaml', field: 'expected_tone' }),
    ]);
  });

  it('nhiều --input; file không tồn tại hoặc không nhận dạng được → lỗi', async () => {
    const opts = await tree({ ...CONTENT, 'staging/la.csv': 'a\n1\n' });
    const result = await runCheck(
      ['--input', 'staging/khong-co.csv', '--input', 'staging/la.csv'],
      opts,
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toEqual([
      'staging/khong-co.csv lỗi: không tìm thấy file/thư mục',
      'staging/la.csv lỗi: không nhận ra loại nội dung từ tên file (vd. words.<nguồn>.csv)',
    ]);
  });

  it('cảnh báo lexicon dùng cả từ trong content/ lẫn input', async () => {
    const opts = await tree({
      ...CONTENT,
      'staging/words.a.csv': `${HEADER}\nma,มา,ma,มา,mid,đến,bai-01\n`,
      'staging/readings/lvl1-009.yaml':
        'id: lvl1-009\ntitle_vi: Thử\nlevel: 1\nsentences:\n  - { th: "ดี|มา|ไป", vi: "x" }\n',
    });
    const report = json((await runCheck(['--input', 'staging', '--json'], opts)).stdout);
    expect(report.issues.map((i) => i.message)).toEqual([
      'từ "ไป" chưa có trong lexicon (vocab/words.csv)',
    ]);
  });
});
