import {
  newSrsState,
  type CardRecord,
  type ListeningStatRecord,
  type ReviewLogRecord,
  type SessionRecord,
  type SettingRecord,
} from '@nom/core';
import Dexie, { type EntityTable, type Transaction } from 'dexie';

/** Plan 7.3 / L-07: mỗi user một database `hoc-thai-nom-<uid>`, Guest dùng `hoc-thai-nom-guest`. */
export const GUEST_KEY = 'guest';
export const dbName = (userKey: string) => `hoc-thai-nom-${userKey}`;

/** Phiên bản schema hiện tại — cũng ghi vào `meta.schemaVersion` (plan 7.3). */
export const SCHEMA_VERSION = 2;
export const SCHEMA_VERSION_KEY = 'schemaVersion';

export type KeyValueRecord = { key: string; value: unknown };

/** Store chứa tiến độ học — được chuyển khi Guest đăng nhập (L-07). `meta` không chuyển. */
export const PROGRESS_TABLES = [
  'cards',
  'reviewLogs',
  'listeningStats',
  'sessions',
  'settings',
] as const;

/** v1 (M1): khung store, bản ghi chỉ có vài trường. */
const STORES_V1 = {
  cards: 'id, itemType, itemId, updatedAt',
  reviewLogs: 'id, cardId, ts',
  listeningStats: 'id, ts',
  sessions: 'id, startedAt',
  settings: 'key',
  meta: 'key',
};

/** v2 (M5): index cho repository — tìm thẻ theo mục, thẻ đến hạn, thẻ mới/ngày, log theo thời gian. */
const STORES_V2 = {
  cards: 'id, [itemType+itemId+cardType], itemType, fsrs.due, createdAt, updatedAt',
  reviewLogs: 'id, cardId, review',
  listeningStats: 'id, ts',
  sessions: 'id, startedAt',
  settings: 'key',
  meta: 'key',
};

/** v1 → v2: thẻ cũ thiếu trường thì bổ sung mặc định (thẻ mới, loại Thai → Việt). */
async function upgradeToV2(tx: Transaction) {
  const now = new Date();
  const ts = now.toISOString();
  await tx
    .table('cards')
    .toCollection()
    .modify((card: Partial<CardRecord>) => {
      card.cardType ??= 'th-vi';
      card.fsrs ??= newSrsState(now);
      card.updatedAt ??= ts;
      card.createdAt ??= card.updatedAt;
    });
  await tx
    .table('settings')
    .toCollection()
    .modify((s: Partial<SettingRecord>) => {
      s.updatedAt ??= ts;
    });
  await tx.table('meta').put({ key: SCHEMA_VERSION_KEY, value: 2 });
}

export class NomDatabase extends Dexie {
  cards!: EntityTable<CardRecord, 'id'>;
  reviewLogs!: EntityTable<ReviewLogRecord, 'id'>;
  listeningStats!: EntityTable<ListeningStatRecord, 'id'>;
  sessions!: EntityTable<SessionRecord, 'id'>;
  settings!: EntityTable<SettingRecord, 'key'>;
  meta!: EntityTable<KeyValueRecord, 'key'>;

  constructor(userKey: string) {
    super(dbName(userKey));
    this.version(1).stores(STORES_V1);
    this.version(2).stores(STORES_V2).upgrade(upgradeToV2);
    this.on('populate', (tx) => {
      void tx.table('meta').add({ key: SCHEMA_VERSION_KEY, value: SCHEMA_VERSION });
    });
  }
}
