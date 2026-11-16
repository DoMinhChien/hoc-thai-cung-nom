import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { AccountDataRepository } from './account-data-repository';
import { countCards, seedCards, testCard } from '@/test/cards';
import { dbName, GUEST_KEY, NomDatabase } from './db';

const repo = new AccountDataRepository();

afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('AccountDataRepository', () => {
  it('tên DB theo uid / guest (plan 7.3)', () => {
    expect(dbName(GUEST_KEY)).toBe('hoc-thai-nom-guest');
    expect(dbName('abc')).toBe('hoc-thai-nom-abc');
  });

  it('hasProgress: DB chưa tồn tại → false và không tạo DB', async () => {
    expect(await repo.hasProgress(GUEST_KEY)).toBe(false);
    expect(await Dexie.exists(dbName(GUEST_KEY))).toBe(false);
  });

  it('hasProgress: chỉ có meta (đã chọn Guest) → false; có thẻ → true', async () => {
    await repo.setGuestChosen();
    expect(await repo.hasProgress(GUEST_KEY)).toBe(false);
    await seedCards(GUEST_KEY, 1);
    expect(await repo.hasProgress(GUEST_KEY)).toBe(true);
  });

  it('transferGuestProgress: copy sang user, Guest rỗng, giữ dữ liệu sẵn có của user (L-07)', async () => {
    await repo.setGuestChosen();
    await seedCards(GUEST_KEY, 3);
    await seedCards('u1', 1);

    await repo.transferGuestProgress('u1');

    expect(await countCards('u1')).toBe(4);
    expect(await countCards(GUEST_KEY)).toBe(0);
    expect(await repo.isGuestChosen()).toBe(true);
  });

  it('transferGuestProgress: cùng mục + loại thẻ ở cả hai → giữ bản cập nhật sau', async () => {
    const older = '2026-03-01T00:00:00.000Z';
    const newer = '2026-03-02T00:00:00.000Z';
    const guest = new NomDatabase(GUEST_KEY);
    await guest.cards.bulkPut([
      testCard('g-ko', { itemId: 'ko-kai', updatedAt: newer }),
      testCard('g-kho', { itemId: 'kho-khai', updatedAt: older }),
    ]);
    guest.close();
    const user = new NomDatabase('u1');
    await user.cards.bulkPut([
      testCard('u-ko', { itemId: 'ko-kai', updatedAt: older }),
      testCard('u-kho', { itemId: 'kho-khai', updatedAt: newer }),
    ]);
    user.close();

    await repo.transferGuestProgress('u1');

    const db = new NomDatabase('u1');
    expect((await db.cards.toArray()).map((c) => c.id).sort()).toEqual(['g-ko', 'u-kho']);
    db.close();
  });

  it('deleteUserData: xoá DB của user, không đụng Guest (L-08)', async () => {
    await seedCards('u1', 2);
    await seedCards(GUEST_KEY, 1);
    await repo.deleteUserData('u1');
    expect(await Dexie.exists(dbName('u1'))).toBe(false);
    expect(await countCards(GUEST_KEY)).toBe(1);
  });

  it('isGuestChosen / setGuestChosen', async () => {
    expect(await repo.isGuestChosen()).toBe(false);
    await repo.setGuestChosen();
    expect(await repo.isGuestChosen()).toBe(true);
  });
});
