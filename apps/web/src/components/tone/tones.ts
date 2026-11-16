import type { Tone } from '@nom/core';

/** Thứ tự 5 thanh khi hiển thị. */
export const TONES: readonly Tone[] = ['mid', 'low', 'falling', 'high', 'rising'];

/** Màu thanh (tokens `tone-*`) — chỉ dùng tên class Tailwind sinh từ token. */
export const TONE_BG: Record<Tone, string> = {
  mid: 'bg-tone-mid',
  low: 'bg-tone-low',
  falling: 'bg-tone-falling',
  high: 'bg-tone-high',
  rising: 'bg-tone-rising',
};

export const TONE_TEXT: Record<Tone, string> = {
  mid: 'text-tone-mid',
  low: 'text-tone-low',
  falling: 'text-tone-falling',
  high: 'text-tone-high',
  rising: 'text-tone-rising',
};

/** Số Chao đầu → cuối (1 thấp … 5 cao) — tokens.json `tone.*.chao`, nguồn vẽ `ToneContour`. */
export const TONE_CHAO: Record<Tone, readonly [number, number]> = {
  mid: [3, 3],
  low: [2, 1],
  falling: [4, 1],
  high: [4, 5],
  rising: [1, 4],
};

/** Cao độ Chao 1–5 → toạ độ y trong khung 20×20 (5 ở trên). */
export const chaoY = (level: number) => 18 - (level - 1) * 4;

/** Đường cong từ mức đầu sang mức cuối: giữ cao độ đầu một đoạn rồi chuyển dần. */
export function contourPath(tone: Tone) {
  const [from, to] = TONE_CHAO[tone];
  const y1 = chaoY(from);
  const y2 = chaoY(to);
  return `M2 ${y1} C7 ${y1} 9 ${y2} 14 ${y2}`;
}
