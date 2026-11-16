import { describe, expect, it } from 'vitest';
import type { FinalSound, Tone, ToneMark, VowelLength } from '../schema/common';
import { consonantClass, HIGH_CONSONANTS, LOW_CONSONANTS, MID_CONSONANTS } from './classes';
import { computeTone, TONE_RULES, type ToneInput } from './engine';
import { inherentFinal } from './inherent-final';

/** Ví dụ ngữ pháp chuẩn (sách giáo khoa) để kiểm tra quy tắc — không phải nội dung học. */
type Case = [
  word: string,
  initial: string,
  length: VowelLength,
  final: FinalSound | null,
  mark: ToneMark | null,
  leading?: string,
];

const input = ([thai, initial, length, final, mark, leading]: Case): ToneInput => ({
  thai,
  initial_char: initial,
  vowel_length: length,
  final_sound: final,
  tone_mark: mark,
  leading: leading ?? null,
});

/** Mỗi ô hợp lệ của bảng 6.3: [rule, thanh mong đợi, ≥ 2 ví dụ]. */
const TABLE: [rule: string, tone: Tone, cases: Case[]][] = [
  // Lớp trung
  [
    'mid:live',
    'mid',
    [
      ['กา', 'ก', 'long', null, null],
      ['จาน', 'จ', 'long', 'n', null],
      ['ตัว', 'ต', 'long', null, null],
    ],
  ],
  [
    'mid:dead',
    'low',
    [
      ['จะ', 'จ', 'short', null, null],
      ['กัด', 'ก', 'short', 't', null],
      ['ปาก', 'ป', 'long', 'k', null],
    ],
  ],
  [
    'mid:ek',
    'low',
    [
      ['ป่า', 'ป', 'long', null, 'ek'],
      ['อ่าน', 'อ', 'long', 'n', 'ek'],
    ],
  ],
  [
    'mid:tho',
    'falling',
    [
      ['ป้า', 'ป', 'long', null, 'tho'],
      ['บ้าน', 'บ', 'long', 'n', 'tho'],
      ['ต้ม', 'ต', 'short', 'm', 'tho'],
    ],
  ],
  [
    'mid:tri',
    'high',
    [
      ['โต๊ะ', 'ต', 'short', null, 'tri'],
      ['ป๊า', 'ป', 'long', null, 'tri'],
    ],
  ],
  [
    'mid:chattawa',
    'rising',
    [
      ['จ๋า', 'จ', 'long', null, 'chattawa'],
      ['ตั๋ว', 'ต', 'long', null, 'chattawa'],
    ],
  ],
  // Lớp cao
  [
    'high:live',
    'rising',
    [
      ['ขา', 'ข', 'long', null, null],
      ['สาม', 'ส', 'long', 'm', null],
      ['หู', 'ห', 'long', null, null],
    ],
  ],
  [
    'high:dead',
    'low',
    [
      ['ขาด', 'ข', 'long', 't', null],
      ['สุข', 'ส', 'short', 'k', null],
      ['ผะ', 'ผ', 'short', null, null],
    ],
  ],
  [
    'high:ek',
    'low',
    [
      ['ข่าว', 'ข', 'long', 'w', 'ek'],
      ['ส่ง', 'ส', 'short', 'ng', 'ek'],
    ],
  ],
  [
    'high:tho',
    'falling',
    [
      ['ข้าว', 'ข', 'long', 'w', 'tho'],
      ['ห้า', 'ห', 'long', null, 'tho'],
    ],
  ],
  // Lớp thấp
  [
    'low:live',
    'mid',
    [
      ['มา', 'ม', 'long', null, null],
      ['คน', 'ค', 'short', 'n', null],
      ['วัน', 'ว', 'short', 'n', null],
    ],
  ],
  [
    'low:dead-short',
    'high',
    [
      ['รัก', 'ร', 'short', 'k', null],
      ['คะ', 'ค', 'short', null, null],
    ],
  ],
  [
    'low:dead-long',
    'falling',
    [
      ['มาก', 'ม', 'long', 'k', null],
      ['ลูก', 'ล', 'long', 'k', null],
    ],
  ],
  [
    'low:ek',
    'falling',
    [
      ['พ่อ', 'พ', 'long', null, 'ek'],
      ['ที่', 'ท', 'long', null, 'ek'],
    ],
  ],
  [
    'low:tho',
    'high',
    [
      ['ม้า', 'ม', 'long', null, 'tho'],
      ['น้อง', 'น', 'long', 'ng', 'tho'],
    ],
  ],
];

/** 4 ô "—" của bảng 6.3. */
const INVALID: Case[] = [
  ['ข๊า', 'ข', 'long', null, 'tri'],
  ['ส๊ะ', 'ส', 'short', null, 'tri'],
  ['ข๋า', 'ข', 'long', null, 'chattawa'],
  ['ส๋ม', 'ส', 'short', 'm', 'chattawa'],
  ['ม๊า', 'ม', 'long', null, 'tri'],
  ['ค๊ะ', 'ค', 'short', null, 'tri'],
  ['ม๋า', 'ม', 'long', null, 'chattawa'],
  ['น๋ม', 'น', 'short', 'm', 'chattawa'],
];

describe('computeTone — bảng quy tắc 6.3', () => {
  for (const [rule, tone, cases] of TABLE) {
    it(`${rule} → ${tone} (${cases.map((c) => c[0]).join(', ')})`, () => {
      expect(cases.length).toBeGreaterThanOrEqual(2);
      for (const c of cases) {
        const result = computeTone(input(c));
        expect(result, c[0]).toMatchObject({ ok: true, tone, rule });
      }
    });
  }

  it('TONE_RULES liệt kê đúng các ô hợp lệ của bảng (không ô "—")', () => {
    expect(TONE_RULES).toEqual(Object.fromEntries(TABLE.map(([rule, tone]) => [rule, tone])));
  });

  it.each(INVALID.map((c) => [c[0], c] as const))('ô "—": %s → lỗi invalid-tone-mark', (_w, c) => {
    const result = computeTone(input(c));
    expect(result).toMatchObject({ ok: false, error: 'invalid-tone-mark' });
    // vẫn trả 3 bước đầu để Tone Trainer chỉ ra chỗ sai
    expect(result.steps.map((s) => s.step)).toEqual(['class', 'liveness', 'tone-mark']);
  });
});

describe('computeTone — ห นำ / อ นำ', () => {
  it.each<[Case, Tone, string]>([
    [['หมา', 'ม', 'long', null, null, 'ห'], 'rising', 'high:live'],
    [['หนู', 'น', 'long', null, null, 'ห'], 'rising', 'high:live'],
    [['หนัก', 'น', 'short', 'k', null, 'ห'], 'low', 'high:dead'],
    [['หน้า', 'น', 'long', null, 'tho', 'ห'], 'falling', 'high:tho'],
    [['หวั่น', 'ว', 'short', 'n', 'ek', 'ห'], 'low', 'high:ek'],
  ])('ห นำ: %s', (c, tone, rule) => {
    const result = computeTone(input(c));
    expect(result).toMatchObject({ ok: true, tone, rule });
    expect(result.steps[0]).toMatchObject({ step: 'class', value: 'high', reason: 'leading-ho' });
  });

  it.each<[Case, Tone]>([
    [['อย่า', 'ย', 'long', null, 'ek', 'อ'], 'low'],
    [['อยู่', 'ย', 'long', null, 'ek', 'อ'], 'low'],
    [['อย่าง', 'ย', 'long', 'ng', 'ek', 'อ'], 'low'],
    [['อยาก', 'ย', 'long', 'k', null, 'อ'], 'low'],
  ])('อ นำ: %s', (c, tone) => {
    const result = computeTone(input(c));
    expect(result).toMatchObject({ ok: true, tone });
    expect(result.steps[0]).toEqual({
      step: 'class',
      value: 'mid',
      reason: 'leading-o',
      leading: 'อ',
      ownClass: 'low',
    });
  });

  it.each<Case>([
    ['หก', 'ก', 'short', 'k', null, 'ห'],
    ['หข', 'ข', 'long', null, null, 'ห'],
    ['ตค', 'ค', 'long', null, null, 'ต'],
    ['คน', 'น', 'long', null, null, 'ค'],
    ['xน', 'น', 'long', null, null, 'x'],
  ])('dẫn không hợp lệ: %s → invalid-leading', (...c) => {
    expect(computeTone(input(c))).toEqual({ ok: false, error: 'invalid-leading', steps: [] });
  });
});

/** Plan 6.1 + test bổ sung 6.3 (M2.1): mỗi từ = các âm tiết đã phân tích. */
describe('computeTone — อักษรนำ tổng quát (plan 6.1)', () => {
  it.each<[word: string, syllables: Case[], tones: Tone[]]>([
    [
      'สวัสดี',
      [
        ['ส', 'ส', 'short', null, null],
        ['วัส', 'ว', 'short', 't', null, 'ส'],
        ['ดี', 'ด', 'long', null, null],
      ],
      ['low', 'low', 'mid'],
    ],
    [
      'สนุก',
      [
        ['ส', 'ส', 'short', null, null],
        ['นุก', 'น', 'short', 'k', null, 'ส'],
      ],
      ['low', 'low'],
    ],
    [
      'ขนม',
      [
        ['ข', 'ข', 'short', null, null],
        ['นม', 'น', 'short', 'm', null, 'ข'],
      ],
      ['low', 'rising'],
    ],
    [
      'ตลาด',
      [
        ['ต', 'ต', 'short', null, null],
        ['ลาด', 'ล', 'long', 't', null, 'ต'],
      ],
      ['low', 'low'],
    ],
    [
      'อร่อย',
      [
        ['อ', 'อ', 'short', null, null],
        ['ร่อย', 'ร', 'long', 'y', 'ek', 'อ'],
      ],
      ['low', 'low'],
    ],
  ])('%s', (_word, syllables, tones) => {
    expect(syllables.map((c) => computeTone(input(c)))).toMatchObject(
      tones.map((tone) => ({ ok: true, tone })),
    );
  });

  it('steps của วัส (สวัสดี) ghi rõ: phụ âm dẫn ส → tính theo lớp cao, không theo lớp thấp của ว', () => {
    const result = computeTone(input(['วัส', 'ว', 'short', 't', null, 'ส']));
    expect(result).toEqual({
      ok: true,
      tone: 'low',
      rule: 'high:dead',
      steps: [
        { step: 'class', value: 'high', reason: 'leading', leading: 'ส', ownClass: 'low' },
        { step: 'liveness', value: 'dead', reason: 'stop-final' },
        { step: 'tone-mark', value: 'none' },
        { step: 'tone', value: 'low' },
      ],
    });
  });

  it('ห + phụ âm thấp đơn ngoài ห นำ (ณ, ฬ) vẫn theo lớp cao — lý do "leading"', () => {
    expect(computeTone(input(['หฬา', 'ฬ', 'long', null, null, 'ห'])).steps[0]).toMatchObject({
      value: 'high',
      reason: 'leading',
    });
  });
});

describe('computeTone — nguyên âm có âm cuối sẵn ไ– ใ– –ำ เ–า (plan 6.2)', () => {
  it.each<[Case, Tone, string]>([
    [['ไม่', 'ม', 'short', 'y', 'ek'], 'falling', 'low:ek'],
    [['ใหม่', 'ม', 'short', 'y', 'ek', 'ห'], 'low', 'high:ek'],
    [['ไหม', 'ม', 'short', 'y', null, 'ห'], 'rising', 'high:live'],
    [['ทำ', 'ท', 'short', 'm', null], 'mid', 'low:live'],
    [['เขา', 'ข', 'short', 'w', null], 'rising', 'high:live'],
  ])('%s → sống (âm cuối sẵn)', (c, tone, rule) => {
    const result = computeTone(input(c));
    expect(result).toMatchObject({ ok: true, tone, rule });
    expect(result.steps[1]).toEqual({ step: 'liveness', value: 'live', reason: 'inherent-final' });
  });

  it('thiếu final_sound vẫn tính là sống nhờ nguyên âm (ไป, ใจ)', () => {
    for (const c of [
      ['ไป', 'ป', 'short', null, null],
      ['ใจ', 'จ', 'short', null, null],
    ] as Case[]) {
      expect(computeTone(input(c))).toMatchObject({ ok: true, tone: 'mid', rule: 'mid:live' });
    }
  });

  it('không có chữ âm tiết → dùng final_sound như thường', () => {
    const { thai: _t, ...noThai } = input(['ไม่', 'ม', 'short', 'y', 'ek']);
    expect(computeTone(noThai).steps[1]).toMatchObject({ reason: 'sonorant-final' });
  });
});

describe('inherentFinal', () => {
  it.each([
    ['ไป', 'y'],
    ['ใจ', 'y'],
    ['ไม่', 'y'],
    ['ทำ', 'm'],
    ['น้ำ', 'm'],
    ['เขา', 'w'],
    ['เหงา', 'w'],
    ['เก้า', 'w'],
    ['เกาะ', null],
    ['กา', null],
    ['เก', null],
  ])('%s → %s', (syllable, expected) => {
    expect(inherentFinal(syllable)).toBe(expected);
  });
});

describe('computeTone — sống/chết & các bước', () => {
  it('nguyên âm ngắn + âm cuối vang là âm sống (วัน)', () => {
    const result = computeTone(input(['วัน', 'ว', 'short', 'n', null]));
    expect(result.steps[1]).toEqual({ step: 'liveness', value: 'live', reason: 'sonorant-final' });
  });

  it('nguyên âm dài + âm cuối tắc là âm chết (มาก)', () => {
    const result = computeTone(input(['มาก', 'ม', 'long', 'k', null]));
    expect(result.steps[1]).toEqual({ step: 'liveness', value: 'dead', reason: 'stop-final' });
  });

  it('lý do sống/chết khi không có âm cuối', () => {
    expect(computeTone(input(['มา', 'ม', 'long', null, null])).steps[1]).toMatchObject({
      reason: 'long-vowel',
    });
    expect(computeTone(input(['คะ', 'ค', 'short', null, null])).steps[1]).toMatchObject({
      reason: 'short-open',
    });
  });

  it('đủ 4 bước theo thứ tự A-21 (ไม่ trong plan 5.5)', () => {
    expect(computeTone(input(['ไม่', 'ม', 'short', 'y', 'ek']))).toEqual({
      ok: true,
      tone: 'falling',
      rule: 'low:ek',
      steps: [
        { step: 'class', value: 'low', reason: 'consonant' },
        { step: 'liveness', value: 'live', reason: 'inherent-final' },
        { step: 'tone-mark', value: 'ek' },
        { step: 'tone', value: 'falling' },
      ],
    });
  });

  it('trường tùy chọn vắng mặt = null', () => {
    expect(computeTone({ initial_char: 'ก', vowel_length: 'long' })).toMatchObject({
      ok: true,
      tone: 'mid',
    });
  });

  it('phụ âm không hợp lệ → unknown-consonant', () => {
    expect(computeTone({ initial_char: 'า', vowel_length: 'long' })).toEqual({
      ok: false,
      error: 'unknown-consonant',
      steps: [],
    });
  });
});

describe('consonantClass — plan 6.1', () => {
  it('9 trung, 11 cao, 24 thấp = 44 phụ âm, không trùng', () => {
    const all = [...MID_CONSONANTS, ...HIGH_CONSONANTS, ...LOW_CONSONANTS];
    expect([...MID_CONSONANTS]).toHaveLength(9);
    expect([...HIGH_CONSONANTS]).toHaveLength(11);
    expect([...LOW_CONSONANTS]).toHaveLength(24);
    expect(new Set(all).size).toBe(44);
  });

  it('phủ đúng dải ก (U+0E01) … ฮ (U+0E2E), trừ nguyên âm ฤ (U+0E24) và ฦ (U+0E26)', () => {
    const range = Array.from({ length: 0x0e2e - 0x0e01 + 1 }, (_, i) => 0x0e01 + i);
    for (const code of range) {
      const ch = String.fromCodePoint(code);
      const isVowel = code === 0x0e24 || code === 0x0e26;
      expect(consonantClass(ch) === null, ch).toBe(isVowel);
    }
  });

  it.each([...MID_CONSONANTS].map((c) => [c]))('%s là lớp trung', (c) => {
    expect(consonantClass(c)).toBe('mid');
  });
  it.each([...HIGH_CONSONANTS].map((c) => [c]))('%s là lớp cao', (c) => {
    expect(consonantClass(c)).toBe('high');
  });
  it.each([...LOW_CONSONANTS].map((c) => [c]))('%s là lớp thấp', (c) => {
    expect(consonantClass(c)).toBe('low');
  });

  it.each(['', 'กข', 'a', 'า', '่'])('không phải phụ âm: %j', (c) => {
    expect(consonantClass(c)).toBeNull();
  });
});
