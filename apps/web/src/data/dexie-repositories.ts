import {
  matchesFilter,
  newId,
  type CardFilter,
  type CardType,
  type ItemType,
  type ListeningStatRecord,
  type ProgressRepository,
  type Repositories,
  type ReviewLogRecord,
  type CardRecord,
  type ReviewRepository,
  type SessionRepository,
  type SettingsRepository,
} from '@nom/core';
import type { NomDatabase } from './db';

/** Repository trên Dexie (plan 7.3). Gọi trong `liveQuery` → UI tự cập nhật (4.9). */
class DexieProgressRepository implements ProgressRepository {
  constructor(private readonly db: NomDatabase) {}

  getCard(id: string) {
    return this.db.cards.get(id);
  }
  findCard(itemType: ItemType, itemId: string, cardType: CardType) {
    return this.db.cards
      .where('[itemType+itemId+cardType]')
      .equals([itemType, itemId, cardType])
      .first();
  }
  async listCards(filter: CardFilter = {}) {
    const source = filter.itemType
      ? this.db.cards.where('itemType').equals(filter.itemType)
      : this.db.cards.toCollection();
    return (await source.toArray()).filter((c) => matchesFilter(c, filter));
  }
  async dueCards(now: Date, limit?: number) {
    // Index `fsrs.due` đã sắp tăng dần; thẻ mới (chưa ôn) không tính là đến hạn.
    let query = this.db.cards
      .where('fsrs.due')
      .belowOrEqual(now.toISOString())
      .filter((c) => c.fsrs.state !== 'new');
    if (limit !== undefined) query = query.limit(limit);
    return query.toArray();
  }
  countCreatedBetween(from: Date, to: Date) {
    return this.db.cards
      .where('createdAt')
      .between(from.toISOString(), to.toISOString(), true, false)
      .count();
  }
  async putCard(card: CardRecord) {
    await this.db.cards.put(card);
  }
}

class DexieReviewRepository implements ReviewRepository {
  constructor(private readonly db: NomDatabase) {}

  async addLog(log: ReviewLogRecord) {
    await this.db.reviewLogs.put(log);
  }
  async logsForCard(cardId: string) {
    return (await this.db.reviewLogs.where('cardId').equals(cardId).toArray()).sort((a, b) =>
      a.review.localeCompare(b.review),
    );
  }
  logsBetween(from: Date, to: Date) {
    return this.db.reviewLogs
      .where('review')
      .between(from.toISOString(), to.toISOString(), true, false)
      .toArray();
  }
  async addListeningStat(stat: ListeningStatRecord) {
    await this.db.listeningStats.put(stat);
  }
  listeningStatsBetween(from: Date, to: Date) {
    return this.db.listeningStats
      .where('ts')
      .between(from.toISOString(), to.toISOString(), true, false)
      .toArray();
  }
}

class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly db: NomDatabase) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await this.db.settings.get(key);
    return row ? (row.value as T) : fallback;
  }
  async set(key: string, value: unknown) {
    await this.db.settings.put({ key, value, updatedAt: new Date().toISOString() });
  }
}

class DexieSessionRepository implements SessionRepository {
  constructor(private readonly db: NomDatabase) {}

  async start(module: string, now: Date) {
    const ts = now.toISOString();
    const session = { id: newId(), module, startedAt: ts, endedAt: null, updatedAt: ts };
    await this.db.sessions.add(session);
    return session;
  }
  async end(id: string, now: Date) {
    const ts = now.toISOString();
    await this.db.sessions.update(id, { endedAt: ts, updatedAt: ts });
  }
  listBetween(from: Date, to: Date) {
    return this.db.sessions
      .where('startedAt')
      .between(from.toISOString(), to.toISOString(), true, false)
      .toArray();
  }
}

export function createDexieRepositories(db: NomDatabase): Repositories {
  return {
    progress: new DexieProgressRepository(db),
    reviews: new DexieReviewRepository(db),
    settings: new DexieSettingsRepository(db),
    sessions: new DexieSessionRepository(db),
  };
}
