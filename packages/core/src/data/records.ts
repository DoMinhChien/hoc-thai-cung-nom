/**
 * Bản ghi dữ liệu người dùng (plan 7.3). Mọi bản ghi có UUID (`id`) + `updatedAt` (ISO) để
 * export/import (M12) và đồng bộ (Phase 2). Ngày giờ lưu ISO string UTC (so sánh được theo chuỗi).
 */
import type { Tone } from '../schema/common';
import type { SrsLog, SrsState } from '../srs/srs';

/** Loại mục học có thẻ SRS (A-12: chữ cái vào SRS chung; B-02: từ vựng). */
export const ITEM_TYPES = ['consonant', 'vowel', 'toneMark', 'word'] as const;
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
