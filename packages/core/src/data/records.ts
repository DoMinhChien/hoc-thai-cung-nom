/**
 * Bản ghi dữ liệu người dùng (plan 7.3). Mọi bản ghi có UUID (`id`) + `updatedAt` (ISO) để
 * export/import (M12) và đồng bộ (Phase 2). Ngày giờ lưu ISO string UTC (so sánh được theo chuỗi).
 */
import type { LessonStep } from '../content/bundle';
import type { ExerciseType } from '../exercises/exercises';
import type { ExerciseItemType } from '../exercises/pool';
import type { GameId, GameStats } from '../games/game';
import type { Tone } from '../schema/common';
import type { SrsLog, SrsRating, SrsState } from '../srs/srs';

/** Loại mục học có thẻ SRS (A-12: chữ cái vào SRS chung; B-02: từ vựng; E-10: câu — M9). */
export const ITEM_TYPES = ['consonant', 'vowel', 'toneMark', 'word', 'sentence'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

/** B-05: loại thẻ. */
export const CARD_TYPES = ['th-vi', 'vi-th', 'audio-vi', 'audio-th'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export interface CardRecord {
  id: string;
  itemType: ItemType;
  /** id trong content (vd. `ko-kai`, `sawatdee`). */
  itemId: string;
  cardType: CardType;
  fsrs: SrsState;
  /** Lúc thẻ được đưa vào học — dùng đếm thẻ mới/ngày (B-03). */
  createdAt: string;
  updatedAt: string;
}

export interface ReviewLogRecord extends SrsLog {
  id: string;
  cardId: string;
  /** Thời gian trả lời (ms), nếu đo được. */
  durationMs?: number;
  updatedAt: string;
}

/** Một câu quiz nghe (D, R-04 ma trận nhầm lẫn, P-07). */
export interface ListeningStatRecord {
  id: string;
  expectedTone: Tone;
  answeredTone: Tone;
  correct: boolean;
  /** Từ/âm tiết được hỏi (content id), nếu có. */
  itemId?: string;
  ts: string;
  updatedAt: string;
}

/** Phiên học (R-02). */
export interface SessionRecord {
  id: string;
  module: string;
  startedAt: string;
  endedAt: string | null;
  updatedAt: string;
}

export interface SettingRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

/** Tiến độ một bài học (plan 0.4) — một bản ghi mỗi bài. */
export interface LessonProgressRecord {
  id: string;
  lessonId: string;
  unitId: string;
  /** Bước đã xong (theo `lesson.steps`); bước Bài tập chỉ tính khi đạt ngưỡng (≥ 80%). */
  stepsDone: LessonStep[];
  /** Điểm bài tập cao nhất, 0–1; `null` khi chưa làm. */
  bestScore: number | null;
  /** Lần đầu hoàn thành bài; `null` khi chưa. */
  completedAt: string | null;
  updatedAt: string;
}

/** Người học tự tick một mục can-do của unit (P-11). Mục tự tick khi xong unit không cần bản ghi. */
export interface CanDoRecord {
  id: string;
  unitId: string;
  /** Câu can-do (khóa theo nội dung; giáo viên sửa câu → tick cũ không còn áp dụng). */
  canDo: string;
  checked: boolean;
  updatedAt: string;
}

/** Kỷ lục cá nhân theo trò + nguồn (F-11, P-09) — một bản ghi mỗi cặp. */
export interface GameResultRecord {
  id: string;
  gameId: GameId;
  /** `learned` hoặc `unit:<id>` (`GameSource.key`). */
  source: string;
  best: GameStats;
  plays: number;
  lastPlayedAt: string;
  updatedAt: string;
}

/** Mục bị đánh dấu "cần ôn" (F-12: trò chơi không đổi FSRS) — Bài tập (M9) ưu tiên. */
export interface NeedsReviewRecord {
  id: string;
  itemType: ItemType;
  itemId: string;
  /** Nơi sinh cờ (P-09: số mục "cần ôn" sinh ra từ trò chơi). */
  origin: 'game';
  flaggedAt: string;
  updatedAt: string;
}

/** Bậc dịch của câu (E-11): 2 cụm/câu (E-05, E-04) · 3 sắp xếp có thẻ nhiễu (E-06) · 4 gõ (E-07). */
export const SENTENCE_LEVELS = [2, 3, 4] as const;
export type SentenceLevel = (typeof SENTENCE_LEVELS)[number];

/** Bậc dịch hiện tại của một câu (E-11) — một bản ghi mỗi câu. */
export interface SentenceLevelRecord {
  id: string;
  sentenceId: string;
  level: SentenceLevel;
  /** Số lần đúng liên tiếp ở bậc hiện tại. */
  streak: number;
  updatedAt: string;
}

/**
 * Một lượt trả lời bài tập (M9): nguồn cho "câu sai 7 ngày", "Đúng {n}%" theo unit, P-12 (kỹ năng),
 * R-04' (lỗi hay gặp). `rating` chỉ có ở lần trả lời đầu của mục trong phiên (lần chấm FSRS).
 */
export interface ExerciseAttemptRecord {
  id: string;
  exerciseType: ExerciseType;
  itemType: ExerciseItemType;
  itemId: string;
  unitId: string;
  correct: boolean;
  rating: SrsRating | null;
  /** Câu trả lời của người học (chữ / thẻ nối lại) — hiển thị ở kết quả, R-04'. */
  answer?: string;
  ts: string;
  updatedAt: string;
}
