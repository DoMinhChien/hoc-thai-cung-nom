/**
 * Nguồn câu hỏi cho trò chơi (F-10, sửa v7.2): mặc định mục đã học (đã có thẻ SRS); chưa đủ
 * `MIN_LEARNED_ITEMS` → từ/câu của chuyên đề người học chọn (kể cả chưa học, chơi để làm quen).
 * Bỏ mục draft thiếu nghĩa (từ) / thiếu đáp án (câu).
 */
import type { UnitBundle } from '../content/bundle';
import type { GameItemRef } from './game';

export interface GameWord {
  id: string;
  unitId: string;
  thai: string;
  /** Nghĩa tiếng Việt, ≥ 1. */
  meanings: string[];
  classifier?: string;
}

export interface GameSentence {
  id: string;
  unitId: string;
  vi: string;
  th: string;
  /** `th` + `th_alt`. */
  accepted: string[];
  tokens: string[];
}

export const LEARNED_SOURCE = 'learned';
export const unitSourceKey = (unitId: string) => `unit:${unitId}`;

export interface GameSource {
  /** Khóa lưu kỷ lục: `learned` hoặc `unit:<id>`. */
  key: string;
  /** Chuyên đề khi nguồn là một chuyên đề. */
  unitId?: string;
  words: GameWord[];
  sentences: GameSentence[];
}

/** Dưới ngưỡng này, "Từ đã học" chuyển sang chuyên đề (F-10 v7.2). */
export const MIN_LEARNED_ITEMS = 6;

export function gameWords(bundle: Pick<UnitBundle, 'words'>): GameWord[] {
  return bundle.words
    .filter((w) => w.meaning_vi.length > 0)
    .map((w) => ({
      id: w.id,
      unitId: w.unit_id,
      thai: w.thai,
      meanings: w.meaning_vi,
      ...(w.classifier ? { classifier: w.classifier } : {}),
    }));
}

export function gameSentences(bundle: Pick<UnitBundle, 'sentences'>): GameSentence[] {
  return bundle.sentences.flatMap((s) =>
    s.th
      ? [
          {
            id: s.id,
            unitId: s.unit_id,
            vi: s.vi,
            th: s.th,
            accepted: [s.th, ...s.th_alt],
            tokens: s.tokens,
          },
        ]
      : [],
  );
}

export function unitSource(bundle: UnitBundle): GameSource {
  return {
    key: unitSourceKey(bundle.unit.unit_id),
    unitId: bundle.unit.unit_id,
    words: gameWords(bundle),
    sentences: gameSentences(bundle),
  };
}

/** Mục đã học trong mọi bundle (theo `itemType` + `itemId` của thẻ). */
export function learnedSource(
  bundles: readonly UnitBundle[],
  learned: readonly GameItemRef[],
): GameSource {
  const ids = new Set(learned.map((r) => `${r.itemType}:${r.itemId}`));
  return {
    key: LEARNED_SOURCE,
    words: bundles.flatMap(gameWords).filter((w) => ids.has(`word:${w.id}`)),
    sentences: bundles.flatMap(gameSentences).filter((s) => ids.has(`sentence:${s.id}`)),
  };
}

export const sourceSize = (source: GameSource) => source.words.length + source.sentences.length;

/**
 * Chọn nguồn theo lựa chọn của người học. "Từ đã học" chưa đủ → chuyên đề đầu tiên theo `order`
 * (`fallback: true` — UI nhắc "Bạn đang chơi với từ chưa học của Chuyên đề {n}").
 */
export function selectGameSource(
  bundles: readonly UnitBundle[],
  learned: readonly GameItemRef[],
  choice: string = LEARNED_SOURCE,
): { source: GameSource; fallback: boolean } {
  const units = [...bundles].sort((a, b) => a.unit.order - b.unit.order);
  const chosen = units.find((b) => unitSourceKey(b.unit.unit_id) === choice);
  if (chosen) return { source: unitSource(chosen), fallback: false };
  const source = learnedSource(units, learned);
  if (sourceSize(source) >= MIN_LEARNED_ITEMS || units.length === 0) {
    return { source, fallback: false };
  }
  return { source: unitSource(units[0]!), fallback: true };
}
