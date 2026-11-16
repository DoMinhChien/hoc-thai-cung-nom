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
    expect(await db.meta.get(SCHEMA_VERSION_KEY)).toEqual({ key: SCHEMA_VERSION_KEY, value: 2 });
    db.close();
  });

  it('nâng v1 (M1) → v2 không mất dữ liệu; bổ sung trường còn thiếu', async () => {
    await createV1('u1');
    const db = new NomDatabase('u1');
    await db.open();

    expect(db.verno).toBe(2);
    expect(await db.meta.get(SCHEMA_VERSION_KEY)).toMatchObject({ value: 2 });
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
});
