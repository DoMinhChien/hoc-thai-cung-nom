/**
 * Phiên luyện nói (SCR-10 §3): 10 mục / phiên (từ + câu ngắn ≤ 9 thẻ), mục cần ôn trước; người học
 * tự đánh giá Giống / Gần giống / Chưa giống. Không đổi FSRS — "Chưa giống" chỉ bật cờ "cần ôn".
 */
import type { UnitBundle } from '../content/bundle';
import { newId } from '../data/memory';
import type { SpeakingAttemptRecord, SpeakingSessionSummary } from '../data/records';
import type { Repositories } from '../data/repositories';
import { setNeedsReview } from '../games/results';
import type { Rng } from '../games/rng';
import type { GameSource } from '../games/source';

export const SPEAKING_SESSION_SIZE = 10;
/** Câu dài hơn ngần này thẻ không đưa vào phiên (SCR-10 §3). */
export const SPEAKING_MAX_TOKENS = 9;

export const SELF_RATINGS = ['good', 'close', 'retry'] as const;
export type SelfRating = (typeof SELF_RATINGS)[number];

export interface SpeakingItem {
  itemType: 'word' | 'sentence';
  itemId: string;
  unitId: string;
  /** Chữ Thái mẫu (`thai` / `th`). */
  thai: string;
  vi: string;
  /** `thai` + biến thể (`thai_alt` / `th_alt`) — so khớp Mức 2. */
  accepted: string[];
  /** Thẻ của câu; từ đơn → `[thai]`. */
  tokens: string[];
  phonetic?: string;
}

/** Mọi mục của nguồn nói được: từ có nghĩa, câu có `th` và ≤ `SPEAKING_MAX_TOKENS` thẻ. */
export function speakingPool(
  source: Pick<GameSource, 'words' | 'sentences'>,
  bundles: readonly Pick<UnitBundle, 'words'>[],
): SpeakingItem[] {
  const words = new Map(bundles.flatMap((b) => b.words.map((w) => [w.id, w] as const)));
  return [
    ...source.words.map((w): SpeakingItem => {
      const word = words.get(w.id);
      return {
        itemType: 'word',
        itemId: w.id,
        unitId: w.unitId,
        thai: w.thai,
        vi: w.meanings.join('; '),
        accepted: [w.thai, ...(word?.thai_alt ?? [])],
        tokens: [w.thai],
        ...(word?.phonetic ? { phonetic: word.phonetic } : {}),
      };
    }),
    ...source.sentences
      .filter((s) => s.tokens.length <= SPEAKING_MAX_TOKENS)
      .map((s): SpeakingItem => ({
        itemType: 'sentence',
        itemId: s.id,
        unitId: s.unitId,
        thai: s.th,
        vi: s.vi,
        accepted: s.accepted,
        tokens: s.tokens,
      })),
  ];
}

/** Chọn mục cho một phiên: xáo ngẫu nhiên, mục cần ôn / đến hạn (`priority`, F-10) ra trước. */
export function pickSpeakingItems(
  pool: readonly SpeakingItem[],
  rng: Rng,
  priority: readonly string[] = [],
  size = SPEAKING_SESSION_SIZE,
): SpeakingItem[] {
  const first = new Set(priority);
  const shuffled = rng.shuffle(pool);
  return [
    ...shuffled.filter((i) => first.has(i.itemId)),
    ...shuffled.filter((i) => !first.has(i.itemId)),
  ].slice(0, size);
}

/** Lưu một lượt tự đánh giá; "Chưa giống" → cờ "cần ôn" (`origin: 'speaking'`). */
export async function saveSpeakingAttempt(
  repos: Pick<Repositories, 'reviews' | 'progress'>,
  item: Pick<SpeakingItem, 'itemType' | 'itemId'>,
  rating: SelfRating,
  asrRatio: number | null,
  now: Date,
): Promise<SpeakingAttemptRecord> {
  const ts = now.toISOString();
  const record: SpeakingAttemptRecord = {
    id: newId(),
    itemType: item.itemType,
    itemId: item.itemId,
    selfRating: rating,
    ...(asrRatio === null ? {} : { asrRatio }),
    ts,
    updatedAt: ts,
  };
  await repos.reviews.addSpeakingAttempt(record);
  if (rating === 'retry') {
    await setNeedsReview(
      repos.progress,
      { itemType: item.itemType, itemId: item.itemId },
      true,
      now,
      'speaking',
    );
  }
  return record;
}

/** Tóm tắt phiên (màn kết quả + `SessionRecord.speaking`). */
export function summarizeSpeaking(
  ratings: readonly { rating: SelfRating; asr: boolean }[],
): SpeakingSessionSummary {
  return {
    items: ratings.length,
    good: ratings.filter((r) => r.rating === 'good').length,
    close: ratings.filter((r) => r.rating === 'close').length,
    retry: ratings.filter((r) => r.rating === 'retry').length,
    asr: ratings.some((r) => r.asr),
  };
}
