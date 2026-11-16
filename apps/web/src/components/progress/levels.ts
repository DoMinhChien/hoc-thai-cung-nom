import type { MasteryLevel, Tone } from '@nom/core';

/** Màu mức thuộc (tokens `mastery-*`, plan 4.9) — chỉ dùng tên class Tailwind sinh từ token. */
export const MASTERY_BG: Record<MasteryLevel, string> = {
  none: 'bg-mastery-none',
  learning: 'bg-mastery-learning',
  known: 'bg-mastery-known',
  mastered: 'bg-mastery-mastered',
};

/** Chữ trên nền mức thuộc (nền "Đã thuộc" đậm → chữ trắng như token `mastery.mastered.fg`). */
export const MASTERY_FG: Record<MasteryLevel, string> = {
  none: 'text-foreground',
  learning: 'text-foreground',
  known: 'text-foreground',
  mastered: 'text-primary-foreground',
};

/** Số chấm hiển thị kèm màu để không chỉ dựa vào màu (người mù màu, plan 4.9). */
export const MASTERY_PIPS: Record<MasteryLevel, number> = {
  none: 0,
  learning: 1,
  known: 2,
  mastered: 3,
};

/** Thứ tự hiển thị trong thanh xếp chồng / chú giải: đậm → nhạt. */
export const LEVELS_DESC: readonly MasteryLevel[] = ['mastered', 'known', 'learning', 'none'];

export const TONE_BG: Record<Tone, string> = {
  mid: 'bg-tone-mid',
  low: 'bg-tone-low',
  falling: 'bg-tone-falling',
  high: 'bg-tone-high',
  rising: 'bg-tone-rising',
};

/** Ký hiệu đường cao độ (tokens.json `tone.*.glyph`) — D10: thanh luôn có ký hiệu + tên. */
export const TONE_GLYPH: Record<Tone, string> = {
  mid: '˧',
  low: '˨˩',
  falling: '˦˩',
  high: '˦˥',
  rising: '˩˦',
};

export const TONES: readonly Tone[] = ['mid', 'low', 'falling', 'high', 'rising'];
