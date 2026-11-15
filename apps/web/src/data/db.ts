import Dexie, { type EntityTable } from 'dexie';

/** Plan 7.3 / L-07: mỗi user một database `hoc-thai-nom-<uid>`, Guest dùng `hoc-thai-nom-guest`. */
export const GUEST_KEY = 'guest';
export const dbName = (userKey: string) => `hoc-thai-nom-${userKey}`;

/** Bản ghi chung: UUID + `updatedAt` (plan 7.3). Trường chi tiết của từng store có ở M5. */
export type ProgressRecord = { id: string; updatedAt?: string; [field: string]: unknown };
export type KeyValueRecord = { key: string; value: unknown };

/** Store chứa tiến độ học — được chuyển khi Guest đăng nhập (L-07). `meta` không chuyển. */
export const PROGRESS_TABLES = [
  'cards',
  'reviewLogs',
  'listeningStats',
  'sessions',
  'settings',
] as const;

export class NomDatabase extends Dexie {
  cards!: EntityTable<ProgressRecord, 'id'>;
  reviewLogs!: EntityTable<ProgressRecord, 'id'>;
  listeningStats!: EntityTable<ProgressRecord, 'id'>;
  sessions!: EntityTable<ProgressRecord, 'id'>;
  settings!: EntityTable<KeyValueRecord, 'key'>;
  meta!: EntityTable<KeyValueRecord, 'key'>;

  constructor(userKey: string) {
    super(dbName(userKey));
    // schemaVersion 1 — M5 thêm index/migration cho SRS.
    this.version(1).stores({
      cards: 'id, itemType, itemId, updatedAt',
      reviewLogs: 'id, cardId, ts',
      listeningStats: 'id, ts',
      sessions: 'id, startedAt',
      settings: 'key',
      meta: 'key',
    });
  }
}
