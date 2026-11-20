/**
 * F-02' Đúng hay sai? (SCR-08 §B, v7.3): từ/câu Thái + một nghĩa đề xuất (50% đúng). Luật "3 tim"
 * (`rapid.ts`): giờ mỗi câu theo độ dài, sai / hết giờ mất tim, điểm = combo + tốc độ.
 */
import { availability, cycle, type GameItemRef } from './game';
import { questionTimeMs, rapidGame, type RapidQuestion } from './rapid';
import { createRng } from './rng';
import type { GameSource } from './source';

export const TRUE_FALSE_MIN_ITEMS = 6;
/** Dãy câu (lặp lại khi chơi lâu hơn). */
const QUESTIONS = 60;

export interface TrueFalseQuestion extends RapidQuestion {
  /** Nghĩa đề xuất. */
  shown: string;
  isTrue: boolean;
}

interface Entry {
  item: GameItemRef;
  th: string;
  meaning: string;
  tokens: number;
}

function entries(source: GameSource): Entry[] {
  return [
    ...source.words.map((w) => ({
      item: { itemType: 'word' as const, itemId: w.id },
      th: w.thai,
      meaning: w.meanings.join('; '),
      tokens: 1,
    })),
    ...source.sentences.map((s) => ({
      item: { itemType: 'sentence' as const, itemId: s.id },
      th: s.th,
      meaning: s.vi,
      tokens: s.tokens.length,
    })),
  ];
}

export const trueFalse = rapidGame<TrueFalseQuestion, boolean>({
  id: 'true-false',

  // Đếm nghĩa khác nhau: luôn có nghĩa sai để đề xuất.
  availability: (source) =>
    availability(
      'words',
      TRUE_FALSE_MIN_ITEMS,
      new Set(entries(source).map((e) => e.meaning)).size,
    ),

  generate(source, seed) {
    const rng = createRng(seed);
    const all = entries(source);
    return cycle(rng, all, QUESTIONS).map((e) => {
      const isTrue = rng.next() < 0.5;
      const base = {
        item: e.item,
        th: e.th,
        expected: e.meaning,
        timeMs: questionTimeMs(e.tokens),
      };
      if (isTrue) return { ...base, shown: e.meaning, isTrue };
      // Nghĩa sai: không phải nghĩa của mục cùng chữ Thái (มา "đến" / มา "tới"); ưu tiên mục cùng
      // loại (từ ↔ từ, câu ↔ câu) để khó đoán theo độ dài.
      const valid = new Set(all.filter((o) => o.th === e.th).map((o) => o.meaning));
      const others = all.filter((o) => !valid.has(o.meaning));
      const sameKind = others.filter((o) => o.item.itemType === e.item.itemType);
      const pool = sameKind.length > 0 ? sameKind : others;
      return { ...base, shown: pool[rng.int(pool.length)]!.meaning, isTrue };
    });
  },

  isCorrect: (q, said) => said === q.isTrue,
  // Nhận nhầm nghĩa sai là đúng → ghi lại nghĩa đã nhận.
  given: (q) => (q.isTrue ? undefined : q.shown),
});
