/**
 * Lưu kết quả một lượt chơi (F-11, F-12): kỷ lục theo trò + nguồn, cờ "cần ôn" cho mục sai.
 * **Không** đụng thẻ SRS / log ôn — chỉ dùng phần kỷ lục + cờ của `ProgressRepository`.
 */
import { newId } from '../data/memory';
import type { GameResultRecord } from '../data/records';
import type { ProgressRepository } from '../data/repositories';
import { isBetterResult, type GameItemRef, type GameStats, type GameSummary } from './game';

export interface SavedGameResult {
  record: GameResultRecord;
  /** Kỷ lục mới (kể cả lượt đầu tiên). */
  newBest: boolean;
  /** Kỷ lục trước lượt này; `null` khi chưa chơi. */
  previous: GameStats | null;
}

/** Ngưỡng tỉ lệ đúng cho 3 / 2 sao (plan 0.14); dưới ngưỡng 2 sao vẫn được 1 sao khi đã chơi. */
export const STAR_THRESHOLDS = { three: 0.9, two: 0.6 } as const;
/**
 * Ghép cặp: lật thẻ chưa thấy là bắt buộc (tỉ lệ đúng ~50% dù nhớ tốt) → tính theo số lần ghép
 * sai "thật" (đã thấy cả 2 thẻ, `mistakes`): ≤ 0 → 3 sao, ≤ 2 → 2 sao.
 */
export const MATCH_STAR_MISTAKES = { three: 0, two: 2 } as const;

/**
 * Sao kết quả 1–3 (plan 0.14, mọi trò). `0` = không xếp hạng (chưa trả lời câu nào) — UI ẩn hàng sao.
 */
export function resultStars(
  summary: Pick<GameSummary<string>, 'gameId' | 'total' | 'accuracy' | 'mistakes'>,
): 0 | 1 | 2 | 3 {
  if (summary.total === 0) return 0;
  if (summary.gameId === 'match') {
    const n = summary.mistakes.length;
    return n <= MATCH_STAR_MISTAKES.three ? 3 : n <= MATCH_STAR_MISTAKES.two ? 2 : 1;
  }
  if (summary.accuracy >= STAR_THRESHOLDS.three) return 3;
  if (summary.accuracy >= STAR_THRESHOLDS.two) return 2;
  return 1;
}

const stats = ({ score, correct, total, maxCombo, durationMs }: GameStats): GameStats => ({
  score,
  correct,
  total,
  maxCombo,
  durationMs,
});

/** Gọi khi lượt kết thúc tự nhiên — thoát giữa chừng không lưu (SCR-08 §B). */
export async function saveGameResult(
  progress: Pick<
    ProgressRepository,
    'getGameResult' | 'putGameResult' | 'putNeedsReview' | 'deleteNeedsReview'
  >,
  summary: GameSummary,
  source: string,
  now: Date,
): Promise<SavedGameResult> {
  const ts = now.toISOString();
  const current = await progress.getGameResult(summary.gameId, source);
  const previous = current?.best ?? null;
  const newBest = !previous || isBetterResult(summary.gameId, summary, previous);
  const record: GameResultRecord = {
    id: current?.id ?? newId(),
    gameId: summary.gameId,
    source,
    best: newBest ? stats(summary) : previous,
    plays: (current?.plays ?? 0) + 1,
    lastPlayedAt: ts,
    updatedAt: ts,
  };
  await progress.putGameResult(record);
  for (const m of summary.mistakes) {
    await setNeedsReview(progress, { itemType: m.itemType, itemId: m.itemId }, true, now);
  }
  return { record, newBest, previous };
}

/**
 * Màn kết quả: người học bật/tắt "cần ôn" cho từng mục (tham khảo Memrise — đánh dấu "khó"
 * cuối lượt). Chỉ đổi cờ, không đụng FSRS.
 */
export async function setNeedsReview(
  progress: Pick<ProgressRepository, 'putNeedsReview' | 'deleteNeedsReview'>,
  item: GameItemRef,
  flagged: boolean,
  now: Date,
): Promise<void> {
  if (!flagged) {
    await progress.deleteNeedsReview(item.itemType, item.itemId);
    return;
  }
  const ts = now.toISOString();
  await progress.putNeedsReview({
    id: newId(),
    ...item,
    origin: 'game',
    flaggedAt: ts,
    updatedAt: ts,
  });
}
