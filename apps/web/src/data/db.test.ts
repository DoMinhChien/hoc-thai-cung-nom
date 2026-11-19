import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { dbName, NomDatabase, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from './db';

afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

/** Tạo DB đúng như bản M1 (schema v1) với dữ liệu kiểu cũ. */
async function createV1(userKey: string) {
  const old = new Dexie(dbName(userKey));
  old.version(1).stores({
    cards: 'id, itemType, itemId, updatedAt',
    reviewLogs: 'id, cardId, ts',
    listeningStats: 'id, ts',
    sessions: 'id, startedAt',
    settings: 'key',
    meta: 'key',
  });
  await old.table('cards').bulkPut([
    { id: 'c1', itemType: 'consonant', itemId: 'ko-kai' },
    { id: 'c2', itemType: 'word', itemId: 'di', updatedAt: '2026-01-02T00:00:00.000Z' },
  ]);
  await old.table('settings').put({ key: 'newPerDay', value: 5 });
  await old.table('meta').put({ key: 'guestChosen', value: true });
  old.close();
}

describe('NomDatabase schema (plan 7.3)', () => {
  it('DB mới: schemaVersion trong meta', async () => {
    const db = new NomDatabase('moi');
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
    expect(await db.meta.get(SCHEMA_VERSION_KEY)).toEqual({ key: SCHEMA_VERSION_KEY, value: 4 });
    db.close();
  });

  it('nâng v1 (M1) → v4 không mất dữ liệu; bổ sung trường còn thiếu', async () => {
    await createV1('u1');
    const db = new NomDatabase('u1');
    await db.open();

    expect(db.verno).toBe(4);
    expect(await db.meta.get(SCHEMA_VERSION_KEY)).toMatchObject({ value: 4 });
    expect(await db.meta.get('guestChosen')).toMatchObject({ value: true });

    const [c1, c2] = await db.cards.bulkGet(['c1', 'c2']);
    expect(c1).toMatchObject({ itemType: 'consonant', itemId: 'ko-kai', cardType: 'th-vi' });
    expect(c1!.fsrs.state).toBe('new');
    expect(c1!.createdAt).toBe(c1!.updatedAt);
    expect(c2).toMatchObject({
      updatedAt: '2026-01-02T00:00:00.000Z',
      createdAt: '2026-01-02T00:00:00.000Z',
    });

    const setting = await db.settings.get('newPerDay');
    expect(setting).toMatchObject({ value: 5 });
    expect(setting!.updatedAt).toEqual(expect.any(String));

    // Index mới dùng được sau khi nâng cấp.
    expect(
      await db.cards.where('[itemType+itemId+cardType]').equals(['word', 'di', 'th-vi']).count(),
    ).toBe(1);
    db.close();
  });

  it('nâng v2 (M5) → v4: giữ thẻ, thêm store bài học + can-do (lessonId duy nhất)', async () => {
    const old = new Dexie(dbName('u2'));
    old.version(2).stores({
      cards: 'id, [itemType+itemId+cardType], itemType, fsrs.due, createdAt, updatedAt',
      reviewLogs: 'id, cardId, review',
      listeningStats: 'id, ts',
      sessions: 'id, startedAt',
      settings: 'key',
      meta: 'key',
    });
    await old.table('cards').put({ id: 'c1', itemType: 'word', itemId: 'di', cardType: 'th-vi' });
    await old.table('meta').put({ key: SCHEMA_VERSION_KEY, value: 2 });
    old.close();

    const db = new NomDatabase('u2');
    await db.open();
    expect(db.verno).toBe(4);
    expect(await db.meta.get(SCHEMA_VERSION_KEY)).toMatchObject({ value: 4 });
    expect(await db.cards.get('c1')).toMatchObject({ itemId: 'di' });

    const lesson = {
      lessonId: 'u01-l1',
      unitId: 'u01',
      stepsDone: [],
      bestScore: null,
      completedAt: null,
      updatedAt: '2026-03-01T00:00:00.000Z',
    };
    await db.lessons.add({ id: 'a', ...lesson });
    await expect(db.lessons.add({ id: 'b', ...lesson })).rejects.toThrow();
    expect(await db.lessons.where('unitId').equals('u01').count()).toBe(1);
    db.close();
  });

  it('nâng v3 (M7) → v4: giữ tiến độ bài học, thêm kỷ lục trò chơi + cờ "cần ôn" (khóa duy nhất)', async () => {
    const old = new Dexie(dbName('u3'));
    old.version(3).stores({
      cards: 'id, [itemType+itemId+cardType], itemType, fsrs.due, createdAt, updatedAt',
      reviewLogs: 'id, cardId, review',
      listeningStats: 'id, ts',
      sessions: 'id, startedAt',
      settings: 'key',
      meta: 'key',
      lessons: 'id, &lessonId, unitId, updatedAt',
      canDos: 'id, &[unitId+canDo], unitId',
    });
    await old.table('lessons').put({ id: 'l1', lessonId: 'u01-l1', unitId: 'u01' });
    await old.table('meta').put({ key: SCHEMA_VERSION_KEY, value: 3 });
    old.close();

    const db = new NomDatabase('u3');
    await db.open();
    expect(db.verno).toBe(4);
    expect(await db.meta.get(SCHEMA_VERSION_KEY)).toMatchObject({ value: 4 });
    expect(await db.lessons.get('l1')).toMatchObject({ lessonId: 'u01-l1' });

    const ts = '2026-03-01T00:00:00.000Z';
    const result = {
      gameId: 'match' as const,
      source: 'learned',
      best: { score: 500, correct: 6, total: 8, maxCombo: 0, durationMs: 42_000 },
      plays: 1,
      lastPlayedAt: ts,
      updatedAt: ts,
    };
    await db.gameResults.add({ id: 'a', ...result });
    await expect(db.gameResults.add({ id: 'b', ...result })).rejects.toThrow();
    const flag = {
      itemType: 'word' as const,
      itemId: 'chue',
      origin: 'game' as const,
      flaggedAt: ts,
      updatedAt: ts,
    };
    await db.needsReview.add({ id: 'a', ...flag });
    await expect(db.needsReview.add({ id: 'b', ...flag })).rejects.toThrow();
    db.close();
  });
});
