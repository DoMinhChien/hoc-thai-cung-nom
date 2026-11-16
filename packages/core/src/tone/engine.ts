import type { SyllableAnalysis } from '../schema/alphabet';
import type { ConsonantClass, Tone, ToneMark } from '../schema/common';
import { consonantClass, HO_NAM_FOLLOWERS, O_NAM_FOLLOWERS } from './classes';

/** Âm tiết đã phân tích sẵn (A-20) — cùng tên trường với `tone-drills.yaml`. */
export type ToneInput = Pick<SyllableAnalysis, 'initial_char' | 'vowel_length'> & {
  leading?: SyllableAnalysis['leading'] | undefined;
  final_sound?: SyllableAnalysis['final_sound'] | undefined;
  tone_mark?: SyllableAnalysis['tone_mark'] | undefined;
};

export type Liveness = 'live' | 'dead';

/** 4 bước hiển thị trong Tone Trainer (A-21); người học trả lời từng bước (A-22). */
export type ToneStep =
  | { step: 'class'; value: ConsonantClass; reason: 'consonant' | 'leading-ho' | 'leading-o' }
  | {
      step: 'liveness';
      value: Liveness;
      reason: 'long-vowel' | 'sonorant-final' | 'stop-final' | 'short-open';
    }
  | { step: 'tone-mark'; value: ToneMark | 'none' }
  | { step: 'tone'; value: Tone };

export type ToneError = 'unknown-consonant' | 'invalid-leading' | 'invalid-tone-mark';

export type ToneResult =
  | {
      ok: true;
      tone: Tone;
      /** Ô của bảng quy tắc 6.3 đã dùng, vd. `low:dead-long`, `mid:tho` — cho heatmap P-03. */
      rule: string;
      steps: ToneStep[];
    }
  | { ok: false; error: ToneError; steps: ToneStep[] };

const STOP_FINALS = new Set(['k', 't', 'p']);

/** Plan 6.3 — dấu thanh theo lớp; `null` = ô "—" (không hợp lệ). */
const MARKED: Record<ConsonantClass, Record<ToneMark, Tone | null>> = {
  mid: { ek: 'low', tho: 'falling', tri: 'high', chattawa: 'rising' },
  high: { ek: 'low', tho: 'falling', tri: null, chattawa: null },
  low: { ek: 'falling', tho: 'high', tri: null, chattawa: null },
};

const UNMARKED_LIVE: Record<ConsonantClass, Tone> = { mid: 'mid', high: 'rising', low: 'mid' };

/**
 * Mọi ô hợp lệ của bảng 6.3: `rule` (như `ToneResult.rule`) → thanh. Dùng cho heatmap P-03
 * (vd. tách ô Thấp × chết thành `low:dead-short` → high và `low:dead-long` → falling).
 */
export const TONE_RULES: Readonly<Record<string, Tone>> = Object.fromEntries(
  (['mid', 'high', 'low'] as const).flatMap((cls) => [
    [`${cls}:live`, UNMARKED_LIVE[cls]],
    ...(cls === 'low'
      ? [
          ['low:dead-short', 'high'],
          ['low:dead-long', 'falling'],
        ]
      : [[`${cls}:dead`, 'low']]),
    ...Object.entries(MARKED[cls])
      .filter(([, tone]) => tone)
      .map(([mark, tone]) => [`${cls}:${mark}`, tone]),
  ]),
);

function classStep(input: ToneInput): Extract<ToneStep, { step: 'class' }> | ToneError {
  const base = consonantClass(input.initial_char);
  if (!base) return 'unknown-consonant';
  if (!input.leading) return { step: 'class', value: base, reason: 'consonant' };
  if (input.leading === 'ห' && HO_NAM_FOLLOWERS.includes(input.initial_char)) {
    return { step: 'class', value: 'high', reason: 'leading-ho' };
  }
  if (input.leading === 'อ' && O_NAM_FOLLOWERS.includes(input.initial_char)) {
    return { step: 'class', value: 'mid', reason: 'leading-o' };
  }
  return 'invalid-leading';
}

function livenessStep(input: ToneInput): Extract<ToneStep, { step: 'liveness' }> {
  const final = input.final_sound;
  if (final && STOP_FINALS.has(final))
    return { step: 'liveness', value: 'dead', reason: 'stop-final' };
  if (final) return { step: 'liveness', value: 'live', reason: 'sonorant-final' };
  return input.vowel_length === 'long'
    ? { step: 'liveness', value: 'live', reason: 'long-vowel' }
    : { step: 'liveness', value: 'dead', reason: 'short-open' };
}

/**
 * Tính thanh của âm tiết theo plan mục 6 (pure function).
 * Bước: lớp phụ âm (xét ห นำ / อ นำ) → sống/chết → dấu thanh → kết quả.
 */
export function computeTone(input: ToneInput): ToneResult {
  const cls = classStep(input);
  if (typeof cls === 'string') return { ok: false, error: cls, steps: [] };

  const live = livenessStep(input);
  const mark = input.tone_mark ?? null;
  const steps: ToneStep[] = [cls, live, { step: 'tone-mark', value: mark ?? 'none' }];

  let tone: Tone | null;
  let rule: string;
  if (mark) {
    tone = MARKED[cls.value][mark];
    rule = `${cls.value}:${mark}`;
  } else if (live.value === 'live') {
    tone = UNMARKED_LIVE[cls.value];
    rule = `${cls.value}:live`;
  } else if (cls.value === 'low') {
    // Lớp thấp, chết: nguyên âm ngắn → high, dài → falling.
    const short = input.vowel_length === 'short';
    tone = short ? 'high' : 'falling';
    rule = short ? 'low:dead-short' : 'low:dead-long';
  } else {
    tone = 'low';
    rule = `${cls.value}:dead`;
  }

  if (!tone) return { ok: false, error: 'invalid-tone-mark', steps };
  return { ok: true, tone, rule, steps: [...steps, { step: 'tone', value: tone }] };
}
