/**
 * Interface repository (plan 7.3) — UI chỉ đọc/ghi dữ liệu người dùng qua đây.
 * Phase 1: bản Dexie (`apps/web/src/data`). Phase 2: thêm `SyncedRepository`, UI không đổi.
 */
import type {
  CardRecord,
  CardType,
  ItemType,
  ListeningStatRecord,
  ReviewLogRecord,
  SessionRecord,
} from './records';

export interface CardFilter {
  itemType?: ItemType;
  itemIds?: string[];
}

/** Thẻ SRS. */
export interface ProgressRepository {
  getCard(id: string): Promise<CardRecord | undefined>;
  findCard(itemType: ItemType, itemId: string, cardType: CardType): Promise<CardRecord | undefined>;
  listCards(filter?: CardFilter): Promise<CardRecord[]>;
  /** Thẻ (không phải thẻ mới) có `due` ≤ `now`, quá hạn lâu nhất trước. */
  dueCards(now: Date, limit?: number): Promise<CardRecord[]>;
  /** Số thẻ được đưa vào học trong khoảng [from, to) — B-03. */
  countCreatedBetween(from: Date, to: Date): Promise<number>;
  putCard(card: CardRecord): Promise<void>;
}

/** Log ôn thẻ + thống kê quiz nghe. */
export interface ReviewRepository {
  addLog(log: ReviewLogRecord): Promise<void>;
  logsForCard(cardId: string): Promise<ReviewLogRecord[]>;
  /** Log trong khoảng [from, to), cũ trước. */
  logsBetween(from: Date, to: Date): Promise<ReviewLogRecord[]>;
  addListeningStat(stat: ListeningStatRecord): Promise<void>;
  listeningStatsBetween(from: Date, to: Date): Promise<ListeningStatRecord[]>;
}

export interface SettingsRepository {
  get<T>(key: string, fallback: T): Promise<T>;
  set(key: string, value: unknown): Promise<void>;
}

export interface SessionRepository {
  start(module: string, now: Date): Promise<SessionRecord>;
  end(id: string, now: Date): Promise<void>;
  /** Phiên bắt đầu trong khoảng [from, to), cũ trước. */
  listBetween(from: Date, to: Date): Promise<SessionRecord[]>;
}

export interface Repositories {
  progress: ProgressRepository;
  reviews: ReviewRepository;
  settings: SettingsRepository;
  sessions: SessionRepository;
}
