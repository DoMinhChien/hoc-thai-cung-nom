import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, createBackup, parseBackup, summarizeBackup } from './backup';

const TABLES = ['cards', 'lessons', 'exerciseAttempts', 'settings'];
const NOW = new Date('2026-11-21T03:00:00Z');

describe('xuất / nhập tiến độ (G-02)', () => {
  it('xuất rồi đọc lại được; store thiếu trong tệp = rỗng; tóm tắt số liệu', () => {
    const backup = createBackup(
      {
        cards: [
          { id: 'c1', itemType: 'word', itemId: 'w1' },
          { id: 'c2', itemType: 'word', itemId: 'w1' },
          { id: 'c3', itemType: 'sentence', itemId: 's1' },
        ],
        lessons: [
          { id: 'l1', completedAt: NOW.toISOString() },
          { id: 'l2', completedAt: null },
        ],
        settings: [{ key: 'gameTheme', value: 'sea' }],
      },
      6,
      NOW,
    );
    const r = parseBackup(JSON.stringify(backup), TABLES, 6);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.format).toBe(BACKUP_FORMAT);
    expect(r.backup.exportedAt).toBe(NOW.toISOString());
    expect(r.backup.tables.exerciseAttempts).toEqual([]);
    expect(summarizeBackup(r.backup)).toEqual({
      words: 1,
      sentences: 1,
      lessonsDone: 1,
      attempts: 0,
    });
  });

  it('từ chối: không phải JSON, sai định dạng, bản mới hơn, store lạ, bản ghi thiếu id', () => {
    const ok = createBackup({ cards: [] }, 6, NOW);
    expect(parseBackup('{', TABLES, 6)).toEqual({ ok: false, error: 'json' });
    expect(parseBackup('{"a":1}', TABLES, 6)).toEqual({ ok: false, error: 'format' });
    expect(parseBackup(JSON.stringify(ok), TABLES, 5)).toEqual({ ok: false, error: 'newer' });
    expect(parseBackup(JSON.stringify({ ...ok, tables: { users: [] } }), TABLES, 6)).toEqual({
      ok: false,
      error: 'tables',
    });
    expect(
      parseBackup(JSON.stringify({ ...ok, tables: { cards: [{ itemId: 'x' }] } }), TABLES, 6),
    ).toEqual({ ok: false, error: 'format' });
  });
});
