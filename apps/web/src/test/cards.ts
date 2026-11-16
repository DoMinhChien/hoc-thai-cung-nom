import { newSrsState, type CardRecord } from '@nom/core';
import { NomDatabase } from '@/data/db';

const T0 = new Date('2026-03-01T08:00:00.000Z');

/** Thẻ SRS hợp lệ cho test (mặc định: phụ âm, Thai → Việt, thẻ mới). */
export function testCard(id: string, patch: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    itemType: 'consonant',
    itemId: id,
    cardType: 'th-vi',
    fsrs: newSrsState(T0),
    createdAt: T0.toISOString(),
    updatedAt: T0.toISOString(),
    ...patch,
  };
}

/** Ghi `n` thẻ vào DB của `userKey` (id `<prefix><i>`). */
export async function seedCards(userKey: string, n: number, prefix = `${userKey}-card-`) {
  const db = new NomDatabase(userKey);
  await db.cards.bulkPut(Array.from({ length: n }, (_, i) => testCard(`${prefix}${i}`)));
  db.close();
}

export async function countCards(userKey: string) {
  const db = new NomDatabase(userKey);
  const n = await db.cards.count();
  db.close();
  return n;
}
