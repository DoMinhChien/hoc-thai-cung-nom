/**
 * Repository trong bộ nhớ — cho unit test và component test không cần IndexedDB.
 * Cùng hành vi với bản Dexie (cùng bộ test hợp đồng ở `apps/web/src/data`).
 */
import { selectDue } from '../srs/srs';
import type {
  CardRecord,
  CardType,
  ItemType,
  ListeningStatRecord,
  ReviewLogRecord,
  SessionRecord,
} from './records';
import type {
  CardFilter,
  ProgressRepository,
  Repositories,
  ReviewRepository,
  SessionRepository,
  SettingsRepository,
} from './repositories';

/** UUID v4 — `crypto.randomUUID` có sẵn ở trình duyệt và Node ≥ 19. */
export function newId(): string {
  return (globalThis as unknown as { crypto: { randomUUID(): string } }).crypto.randomUUID();
}

const inRange = (ts: string, from: Date, to: Date) =>
  ts >= from.toISOString() && ts < to.toISOString();
const byField =
  <K extends string>(field: K) =>
  (a: Record<K, string>, b: Record<K, string>) =>
    a[field].localeCompare(b[field]);
// Bản ghi là JSON thuần (plan 7.3) → sao chép kiểu JSON, như khi đi qua IndexedDB/export.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function matchesFilter(card: CardRecord, filter: CardFilter = {}) {
  if (filter.itemType && card.itemType !== filter.itemType) return false;
  if (filter.itemIds && !filter.itemIds.includes(card.itemId)) return false;
  return true;
}

export class MemoryProgressRepository implements ProgressRepository {
  readonly cards = new Map<string, CardRecord>();

  async getCard(id: string) {
    const card = this.cards.get(id);
    return card && clone(card);
  }
  async findCard(itemType: ItemType, itemId: string, cardType: CardType) {
    for (const card of this.cards.values()) {
      if (card.itemType === itemType && card.itemId === itemId && card.cardType === cardType) {
        return clone(card);
      }
    }
    return undefined;
  }
  async listCards(filter?: CardFilter) {
    return [...this.cards.values()].filter((c) => matchesFilter(c, filter)).map(clone);
  }
  async dueCards(now: Date, limit?: number) {
    return selectDue([...this.cards.values()], now, limit).map(clone);
  }
  async countCreatedBetween(from: Date, to: Date) {
    return [...this.cards.values()].filter((c) => inRange(c.createdAt, from, to)).length;
  }
  async putCard(card: CardRecord) {
    this.cards.set(card.id, clone(card));
  }
}

export class MemoryReviewRepository implements ReviewRepository {
  readonly logs: ReviewLogRecord[] = [];
  readonly listening: ListeningStatRecord[] = [];

  async addLog(log: ReviewLogRecord) {
    this.logs.push(clone(log));
  }
  async logsForCard(cardId: string) {
    return this.logs
      .filter((l) => l.cardId === cardId)
      .sort(byField('review'))
      .map(clone);
  }
  async logsBetween(from: Date, to: Date) {
    return this.logs
      .filter((l) => inRange(l.review, from, to))
      .sort(byField('review'))
      .map(clone);
  }
  async addListeningStat(stat: ListeningStatRecord) {
    this.listening.push(clone(stat));
  }
  async listeningStatsBetween(from: Date, to: Date) {
    return this.listening
      .filter((s) => inRange(s.ts, from, to))
      .sort(byField('ts'))
      .map(clone);
  }
}

export class MemorySettingsRepository implements SettingsRepository {
  readonly values = new Map<string, unknown>();

  async get<T>(key: string, fallback: T): Promise<T> {
    return this.values.has(key) ? clone(this.values.get(key) as T) : fallback;
  }
  async set(key: string, value: unknown) {
    this.values.set(key, clone(value));
  }
}

export class MemorySessionRepository implements SessionRepository {
  readonly sessions = new Map<string, SessionRecord>();

  async start(module: string, now: Date) {
    const ts = now.toISOString();
    const session: SessionRecord = {
      id: newId(),
      module,
      startedAt: ts,
      endedAt: null,
      updatedAt: ts,
    };
    this.sessions.set(session.id, session);
    return clone(session);
  }
  async end(id: string, now: Date) {
    const session = this.sessions.get(id);
    if (!session) return;
    session.endedAt = session.updatedAt = now.toISOString();
  }
  async listBetween(from: Date, to: Date) {
    return [...this.sessions.values()]
      .filter((s) => inRange(s.startedAt, from, to))
      .sort(byField('startedAt'))
      .map(clone);
  }
}

export function createMemoryRepositories(): Repositories {
  return {
    progress: new MemoryProgressRepository(),
    reviews: new MemoryReviewRepository(),
    settings: new MemorySettingsRepository(),
    sessions: new MemorySessionRepository(),
  };
}
