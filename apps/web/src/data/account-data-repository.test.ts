import Dexie from 'dexie';
import type { CardRecord } from '@nom/core';
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

  it('transferGuestProgress: tiến độ bài học + can-do cùng khóa → giữ bản cập nhật sau', async () => {
    const older = '2026-03-01T00:00:00.000Z';
    const newer = '2026-03-02T00:00:00.000Z';
    const lesson = (id: string, lessonId: string, updatedAt: string) => ({
      id,
      lessonId,
      unitId: 'u01',
      stepsDone: [],
      bestScore: null,
      completedAt: null,
      updatedAt,
    });
    const canDo = (id: string, updatedAt: string) => ({
      id,
      unitId: 'u01',
      canDo: 'Chào hỏi',
      checked: true,
      updatedAt,
    });
    const guest = new NomDatabase(GUEST_KEY);
    await guest.lessons.bulkPut([lesson('g-l1', 'u01-l1', newer), lesson('g-l2', 'u01-l2', older)]);
    await guest.canDos.put(canDo('g-c', older));
    guest.close();
    const user = new NomDatabase('u1');
    await user.lessons.bulkPut([lesson('u-l1', 'u01-l1', older), lesson('u-l2', 'u01-l2', newer)]);
    await user.canDos.put(canDo('u-c', newer));
    user.close();

    await repo.transferGuestProgress('u1');

    const db = new NomDatabase('u1');
    expect((await db.lessons.toArray()).map((l) => l.id).sort()).toEqual(['g-l1', 'u-l2']);
    expect((await db.canDos.toArray()).map((c) => c.id)).toEqual(['u-c']);
    db.close();
    expect(await repo.hasProgress(GUEST_KEY)).toBe(false);
  });

  it('transferGuestProgress: kỷ lục trò chơi + cờ "cần ôn" cùng khóa → giữ bản cập nhật sau', async () => {
    const older = '2026-03-01T00:00:00.000Z';
    const newer = '2026-03-02T00:00:00.000Z';
    const result = (id: string, source: string, updatedAt: string) => ({
      id,
      gameId: 'true-false' as const,
      source,
      best: { score: 100, correct: 1, total: 1, maxCombo: 1, durationMs: 60_000 },
      plays: 1,
      lastPlayedAt: updatedAt,
      updatedAt,
    });
    const flag = (id: string, itemId: string, updatedAt: string) => ({
      id,
      itemType: 'word' as const,
      itemId,
      origin: 'game' as const,
      flaggedAt: updatedAt,
      updatedAt,
    });
    const guest = new NomDatabase(GUEST_KEY);
    await guest.gameResults.bulkPut([
      result('g-r1', 'learned', newer),
      result('g-r2', 'unit:u01', older),
    ]);
    await guest.needsReview.bulkPut([flag('g-f1', 'chue', older), flag('g-f2', 'khun', older)]);
    guest.close();
    const user = new NomDatabase('u1');
    await user.gameResults.bulkPut([
      result('u-r1', 'learned', older),
      result('u-r2', 'unit:u01', newer),
    ]);
    await user.needsReview.put(flag('u-f1', 'chue', newer));
    user.close();

    await repo.transferGuestProgress('u1');

    const db = new NomDatabase('u1');
    expect((await db.gameResults.toArray()).map((r) => r.id).sort()).toEqual(['g-r1', 'u-r2']);
    expect((await db.needsReview.toArray()).map((f) => f.id).sort()).toEqual(['g-f2', 'u-f1']);
    db.close();
    expect(await repo.hasProgress(GUEST_KEY)).toBe(false);
  });

  it('transferGuestProgress: thẻ thiếu khóa (dữ liệu cũ) vẫn được chuyển, không lỗi', async () => {
    const guest = new NomDatabase(GUEST_KEY);
    await guest.cards.put({ id: 'cu', itemType: 'consonant' } as CardRecord);
    guest.close();
    await repo.transferGuestProgress('u1');
    expect(await countCards('u1')).toBe(1);
    expect(await countCards(GUEST_KEY)).toBe(0);
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
