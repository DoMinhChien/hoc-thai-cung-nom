import type {
  CanDoRecord,
  CardRecord,
  GameResultRecord,
  LessonProgressRecord,
  NeedsReviewRecord,
} from '@nom/core';
import Dexie, { type EntityTable, type IndexableType } from 'dexie';
import { dbName, GUEST_KEY, NomDatabase, PROGRESS_TABLES } from './db';

const GUEST_CHOSEN = 'guestChosen';

/** Mở DB, làm việc rồi đóng ngay — để xoá DB không bị chặn bởi kết nối còn mở. */
async function withDb<T>(userKey: string, work: (db: NomDatabase) => Promise<T>): Promise<T> {
  const db = new NomDatabase(userKey);
  try {
    return await work(db);
  } finally {
    db.close();
  }
}

type Synced = { id: string; updatedAt: string };

/**
 * Bản ghi Guest vào DB user theo khóa duy nhất (`index`): đã có ở user thì giữ bản cập nhật sau
 * (một mục chỉ một thẻ mỗi loại; một bài một bản ghi tiến độ; một mục can-do một tick;
 * một kỷ lục mỗi trò + nguồn; một cờ "cần ôn" mỗi mục).
 * Log ôn của cả hai vẫn giữ (không có khóa duy nhất).
 */
async function mergeUnique<T extends Synced>(
  table: EntityTable<T, 'id'>,
  rows: T[],
  index: string,
  key: (row: T) => IndexableType | undefined,
) {
  for (const row of rows) {
    const value = key(row);
    // Bản ghi thiếu khóa (dữ liệu cũ/hỏng) không tra được index → chuyển nguyên trạng.
    if (value === undefined) {
      await table.put(row);
      continue;
    }
    const existing = await table.where(index).equals(value).first();
    if (existing && existing.id !== row.id) {
      if (existing.updatedAt >= row.updatedAt) continue;
      await table.where('id').equals(existing.id).delete();
    }
    await table.put(row);
  }
}

const cardKey = (c: CardRecord) =>
  c.itemType && c.itemId && c.cardType ? [c.itemType, c.itemId, c.cardType] : undefined;

/**
 * Dữ liệu cấp tài khoản trên IndexedDB (L-07, L-08, flows §2).
 * Tiến độ học chi tiết (thẻ, lịch ôn, bài học, can-do) do `ProgressRepository`… quản lý.
 */
export class AccountDataRepository {
  /** Có tiến độ trong DB của `userKey` không. Không tạo DB nếu chưa có. */
  async hasProgress(userKey: string): Promise<boolean> {
    if (!(await Dexie.exists(dbName(userKey)))) return false;
    return withDb(userKey, async (db) => {
      for (const table of PROGRESS_TABLES) {
        if ((await db.table(table).count()) > 0) return true;
      }
      return false;
    });
  }

  /** L-07: chuyển tiến độ Guest sang DB của user rồi làm rỗng Guest. */
  async transferGuestProgress(uid: string): Promise<void> {
    // Đọc hết Guest trước: transaction Dexie không cho đọc DB khác ở giữa.
    const rows = await withDb(GUEST_KEY, (guest) =>
      Promise.all(PROGRESS_TABLES.map((name) => guest.table(name).toArray())),
    );
    await withDb(uid, (user) =>
      user.transaction('rw', [...PROGRESS_TABLES], async () => {
        for (const [i, name] of PROGRESS_TABLES.entries()) {
          const data = rows[i]!;
          if (name === 'cards') {
            await mergeUnique(
              user.cards,
              data as CardRecord[],
              '[itemType+itemId+cardType]',
              cardKey,
            );
          } else if (name === 'lessons') {
            await mergeUnique(
              user.lessons,
              data as LessonProgressRecord[],
              'lessonId',
              (l) => l.lessonId,
            );
          } else if (name === 'canDos') {
            await mergeUnique(user.canDos, data as CanDoRecord[], '[unitId+canDo]', (c) => [
              c.unitId,
              c.canDo,
            ]);
          } else if (name === 'gameResults') {
            await mergeUnique(
              user.gameResults,
              data as GameResultRecord[],
              '[gameId+source]',
              (r) => [r.gameId, r.source],
            );
          } else if (name === 'needsReview') {
            await mergeUnique(
              user.needsReview,
              data as NeedsReviewRecord[],
              '[itemType+itemId]',
              (r) => [r.itemType, r.itemId],
            );
          } else await user.table(name).bulkPut(data);
        }
      }),
    );
    await withDb(GUEST_KEY, (guest) =>
      guest.transaction('rw', [...PROGRESS_TABLES], async () => {
        for (const name of PROGRESS_TABLES) await guest.table(name).clear();
      }),
    );
  }

  /** L-08: xoá toàn bộ DB của user. */
  async deleteUserData(uid: string): Promise<void> {
    await Dexie.delete(dbName(uid));
  }

  /** Flows §2: đã chọn "Học không cần đăng nhập" trên trình duyệt này chưa. */
  async isGuestChosen(): Promise<boolean> {
    if (!(await Dexie.exists(dbName(GUEST_KEY)))) return false;
    return withDb(GUEST_KEY, async (db) => (await db.meta.get(GUEST_CHOSEN))?.value === true);
  }

  async setGuestChosen(): Promise<void> {
    await withDb(GUEST_KEY, (db) => db.meta.put({ key: GUEST_CHOSEN, value: true }));
  }
}
