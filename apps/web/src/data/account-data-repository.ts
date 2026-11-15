import Dexie from 'dexie';
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

/**
 * Dữ liệu cấp tài khoản trên IndexedDB (L-07, L-08, flows §2).
 * Tiến độ học chi tiết (thẻ, lịch ôn) do các repository của M5 quản lý.
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
        for (const [i, name] of PROGRESS_TABLES.entries()) await user.table(name).bulkPut(rows[i]!);
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
