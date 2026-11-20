/**
 * Interface repository (plan 7.3) — UI chỉ đọc/ghi dữ liệu người dùng qua đây.
 * Phase 1: bản Dexie (`apps/web/src/data`). Phase 2: thêm `SyncedRepository`, UI không đổi.
 */
import type { AnyGameId } from '../games/catalog';
import type {
  CanDoRecord,
  CardRecord,
  CardType,
  ExerciseAttemptRecord,
  GameResultRecord,
  ItemType,
  LessonProgressRecord,
  ListeningStatRecord,
  NeedsReviewRecord,
  ReviewLogRecord,
  SentenceLevelRecord,
  SessionRecord,
} from './records';

export interface CardFilter {
  itemType?: ItemType;
  itemIds?: string[];
}

/** Thẻ SRS + tiến độ bài học, can-do (M7) + kỷ lục trò chơi, cờ "cần ôn" (M7.5) + bậc dịch câu (M9). */
export interface ProgressRepository {
  getCard(id: string): Promise<CardRecord | undefined>;
  findCard(itemType: ItemType, itemId: string, cardType: CardType): Promise<CardRecord | undefined>;
  listCards(filter?: CardFilter): Promise<CardRecord[]>;
  /** Thẻ (không phải thẻ mới) có `due` ≤ `now`, quá hạn lâu nhất trước. */
  dueCards(now: Date, limit?: number): Promise<CardRecord[]>;
  /** Số thẻ được đưa vào học trong khoảng [from, to) — B-03. */
  countCreatedBetween(from: Date, to: Date): Promise<number>;
  putCard(card: CardRecord): Promise<void>;

  getLessonProgress(lessonId: string): Promise<LessonProgressRecord | undefined>;
  /** Tiến độ các bài (của một unit nếu có `unitId`). */
  listLessonProgress(unitId?: string): Promise<LessonProgressRecord[]>;
  /** Ghi theo `lessonId` (một bản ghi mỗi bài). */
  putLessonProgress(record: LessonProgressRecord): Promise<void>;
  listCanDo(unitId: string): Promise<CanDoRecord[]>;
  /** Ghi theo `unitId` + `canDo` (một bản ghi mỗi mục). */
  putCanDo(record: CanDoRecord): Promise<void>;

  getGameResult(gameId: AnyGameId, source: string): Promise<GameResultRecord | undefined>;
  listGameResults(): Promise<GameResultRecord[]>;
  /** Ghi theo `gameId` + `source` (một bản ghi mỗi cặp). */
  putGameResult(record: GameResultRecord): Promise<void>;
  listNeedsReview(): Promise<NeedsReviewRecord[]>;
  /** Ghi theo `itemType` + `itemId` (một cờ mỗi mục). */
  putNeedsReview(record: NeedsReviewRecord): Promise<void>;
  deleteNeedsReview(itemType: ItemType, itemId: string): Promise<void>;

  getSentenceLevel(sentenceId: string): Promise<SentenceLevelRecord | undefined>;
  listSentenceLevels(): Promise<SentenceLevelRecord[]>;
  /** Ghi theo `sentenceId` (một bản ghi mỗi câu). */
  putSentenceLevel(record: SentenceLevelRecord): Promise<void>;
}

/** Log ôn thẻ + thống kê quiz nghe. */
export interface ReviewRepository {
  addLog(log: ReviewLogRecord): Promise<void>;
  logsForCard(cardId: string): Promise<ReviewLogRecord[]>;
  /** Log trong khoảng [from, to), cũ trước. */
  logsBetween(from: Date, to: Date): Promise<ReviewLogRecord[]>;
  addListeningStat(stat: ListeningStatRecord): Promise<void>;
  addAttempt(attempt: ExerciseAttemptRecord): Promise<void>;
  /** Lượt trả lời bài tập trong khoảng [from, to), cũ trước. */
  attemptsBetween(from: Date, to: Date): Promise<ExerciseAttemptRecord[]>;
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
