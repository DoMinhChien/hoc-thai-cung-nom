/**
 * Thao tác học dùng chung cho mọi màn (M6+): đưa thẻ vào học, ghi một lượt ôn.
 * Chỉ dùng interface repository → chạy được trên Dexie lẫn bộ nhớ.
 */
import { reviewSrs, newSrsState, type SrsRating } from '../srs/srs';
import { newId } from './memory';
import type { CardRecord, CardType, ItemType } from './records';
import type { ProgressRepository, ReviewRepository } from './repositories';

/** Lấy thẻ của mục; chưa có thì tạo thẻ mới (tính vào thẻ mới hôm nay — B-03). */
export async function introduceCard(
  progress: ProgressRepository,
  item: { itemType: ItemType; itemId: string; cardType: CardType },
  now: Date,
): Promise<CardRecord> {
  const existing = await progress.findCard(item.itemType, item.itemId, item.cardType);
  if (existing) return existing;
  const ts = now.toISOString();
  const card: CardRecord = {
    id: newId(),
    ...item,
    fsrs: newSrsState(now),
    createdAt: ts,
    updatedAt: ts,
  };
  await progress.putCard(card);
  return card;
}

/** Ghi một lượt ôn: cập nhật lịch FSRS của thẻ + thêm log. */
export async function recordReview(
  repos: { progress: ProgressRepository; reviews: ReviewRepository },
  card: CardRecord,
  rating: SrsRating,
  now: Date,
  durationMs?: number,
): Promise<CardRecord> {
  const { state, log } = reviewSrs(card.fsrs, rating, now);
  const ts = now.toISOString();
  const updated: CardRecord = { ...card, fsrs: state, updatedAt: ts };
  await repos.progress.putCard(updated);
  await repos.reviews.addLog({
    ...log,
    id: newId(),
    cardId: card.id,
    ...(durationMs === undefined ? {} : { durationMs }),
    updatedAt: ts,
  });
  return updated;
}
