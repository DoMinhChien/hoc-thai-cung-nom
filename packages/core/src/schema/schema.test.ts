import { describe, expect, it } from 'vitest';
import {
  ConsonantSchema,
  DeckSchema,
  ImageSchema,
  MinimalPairSchema,
  ReadingSchema,
  SyllableAnalysisSchema,
  ToneEntrySchema,
  ToneMarkEntrySchema,
  VowelSchema,
  WordRowSchema,
} from './index';

// Mẫu tối thiểu lấy từ plan mục 5.5 — chỉ để test cấu trúc, không phải nội dung học.
const consonant = {
  id: 'ko-kai',
  char: 'ก',
  name: 'ก ไก่',
  class: 'mid',
  initial: 'k',
  final: 'k',
  phonetic: 'k',
  keyword_vi: 'con gà',
  image: 'noto:1f414',
  mnemonic_vi: 'ก giống cổ con gà cong xuống',
  order: 1,
};

const drill = {
  id: 'mai-1',
  thai: 'ไม่',
  initial_char: 'ม',
  leading: null,
  vowel_length: 'long',
  final_sound: null,
  tone_mark: 'ek',
  expected_tone: 'falling',
};

const wordRow = {
  id: 'sawatdee',
  thai: 'สวัสดี',
  phonetic: 'sa-wat-di',
  syllables: 'ส|วัส|ดี',
  tones: 'low|low|mid',
  meaning_vi: 'xin chào',
  pos: 'interj',
  deck: 'bai-01',
  example_th: '',
  example_vi: '',
  tags: 'polite;common',
  source: 'giao-trinh-a.pdf#p12',
  image: 'noto:1f44b',
  mnemonic_vi: '',
};

const reading = {
  id: 'lvl1-001',
  title_vi: 'Chào hỏi',
  level: 1,
  sentences: [{ th: 'สวัสดี|ครับ', vi: 'Xin chào (nam nói)' }],
};

const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((i) => i.path.join('.')) ?? [];

describe('ConsonantSchema', () => {
  it('parse mẫu plan 5.5, draft mặc định false', () => {
    const parsed = ConsonantSchema.parse(consonant);
    expect(parsed.class).toBe('mid');
    expect(parsed.draft).toBe(false);
  });

  it('final mặc định null', () => {
    const { final: _final, ...rest } = consonant;
    expect(ConsonantSchema.parse(rest).final).toBeNull();
  });

  it.each([
    ['id', { id: 'Ko Kai' }],
    ['char', { char: 'กข' }],
    ['char', { char: 'a' }],
    ['class', { class: 'middle' }],
    ['phonetic', { phonetic: 'kà' }],
    ['order', { order: 0 }],
    ['image', { image: 'gà.png' }],
  ])('bắt lỗi %s', (path, patch) => {
    const result = ConsonantSchema.safeParse({ ...consonant, ...patch });
    expect(issuePaths(result)).toContain(path);
  });

  it('báo lỗi trường lạ (gõ sai tên)', () => {
    const result = ConsonantSchema.safeParse({ ...consonant, keywrd_vi: 'x' });
    expect(result.success).toBe(false);
  });

  it('báo lỗi thiếu trường bắt buộc', () => {
    const { keyword_vi: _kw, ...rest } = consonant;
    expect(issuePaths(ConsonantSchema.safeParse(rest))).toContain('keyword_vi');
  });
});

describe('SyllableAnalysisSchema', () => {
  it('parse mẫu plan 5.5', () => {
    expect(SyllableAnalysisSchema.parse(drill)).toMatchObject({ tone_mark: 'ek', leading: null });
  });

  it('leading / final_sound / tone_mark mặc định null', () => {
    const { leading: _l, final_sound: _f, tone_mark: _t, ...rest } = drill;
    expect(SyllableAnalysisSchema.parse(rest)).toMatchObject({
      leading: null,
      final_sound: null,
      tone_mark: null,
    });
  });

  it('leading nhận mọi phụ âm cao/trung (อักษรนำ, plan 5.5 sawat-2); tone_override + note', () => {
    for (const leading of ['ห', 'อ', 'ส', 'ข', 'ต', 'ก']) {
      expect(SyllableAnalysisSchema.safeParse({ ...drill, leading }).success, leading).toBe(true);
    }
    expect(
      SyllableAnalysisSchema.parse({
        ...drill,
        thai: 'วัส',
        initial_char: 'ว',
        leading: 'ส',
        tone_override: true,
        note: 'ví dụ',
      }),
    ).toMatchObject({ leading: 'ส', tone_override: true, note: 'ví dụ' });
  });

  it.each([
    ['leading', { leading: 'ม' }],
    ['leading', { leading: 'สม' }],
    ['final_sound', { final_sound: 'x' }],
    ['expected_tone', { expected_tone: 'sac' }],
    ['vowel_length', { vowel_length: 'medium' }],
  ])('bắt lỗi %s', (path, patch) => {
    expect(issuePaths(SyllableAnalysisSchema.safeParse({ ...drill, ...patch }))).toContain(path);
  });
});

describe('WordRowSchema', () => {
  it('parse mẫu plan 5.5: tách |, ;, ô trống → undefined', () => {
    const row = WordRowSchema.parse(wordRow);
    expect(row.syllables).toEqual(['ส', 'วัส', 'ดี']);
    expect(row.tones).toEqual(['low', 'low', 'mid']);
    expect(row.meaning_vi).toEqual(['xin chào']);
    expect(row.tags).toEqual(['polite', 'common']);
    expect(row.example_th).toBeUndefined();
    expect(row.mnemonic_vi).toBeUndefined();
    expect(row.draft).toBe(false);
  });

  it('nhiều nghĩa ngăn bằng ;', () => {
    const row = WordRowSchema.parse({ ...wordRow, meaning_vi: 'xin chào; tạm biệt' });
    expect(row.meaning_vi).toEqual(['xin chào', 'tạm biệt']);
  });

  it('cột tùy chọn có thể vắng mặt; draft=true', () => {
    const row = WordRowSchema.parse({
      id: 'x',
      thai: 'ดี',
      phonetic: 'di',
      syllables: 'ดี',
      tones: 'mid',
      meaning_vi: 'tốt',
      deck: 'bai-01',
      draft: 'true',
    });
    expect(row.tags).toEqual([]);
    expect(row.draft).toBe(true);
  });

  it('v7: syllables/tones tùy chọn — vắng hoặc ô trống → []', () => {
    const { syllables: _s, tones: _t, ...rest } = wordRow;
    expect(WordRowSchema.parse(rest)).toMatchObject({ syllables: [], tones: [] });
    expect(WordRowSchema.parse({ ...wordRow, syllables: '', tones: '' })).toMatchObject({
      syllables: [],
      tones: [],
    });
  });

  it('chỉ có syllables, không có tones → hợp lệ', () => {
    expect(WordRowSchema.parse({ ...wordRow, tones: '' }).syllables).toHaveLength(3);
  });

  it('syllables và tones lệch độ dài → lỗi ở tones', () => {
    expect(issuePaths(WordRowSchema.safeParse({ ...wordRow, tones: 'low|mid' }))).toContain(
      'tones',
    );
  });

  it.each([
    ['tones.1', { tones: 'low|ngang|mid' }],
    ['meaning_vi', { meaning_vi: ' ; ' }],
    ['deck', { deck: 'Bài 1' }],
    ['thai', { thai: 'sawatdee' }],
    ['phonetic', { phonetic: 'sà-wàt-dii' }],
    ['image', { image: 'http://x/y.png' }],
  ])('bắt lỗi %s', (path, patch) => {
    expect(issuePaths(WordRowSchema.safeParse({ ...wordRow, ...patch }))).toContain(path);
  });
});

describe('ReadingSchema', () => {
  it('parse mẫu plan 5.5', () => {
    expect(ReadingSchema.parse(reading).sentences).toHaveLength(1);
  });

  it.each([
    ['level', { level: 6 }],
    ['level', { level: 1.5 }],
    ['sentences', { sentences: [] }],
  ])('bắt lỗi %s', (path, patch) => {
    expect(issuePaths(ReadingSchema.safeParse({ ...reading, ...patch }))).toContain(path);
  });
});

describe('MinimalPairSchema', () => {
  const pair = {
    id: 'pair-1',
    words: [
      { thai: 'ไม้', tone: 'high' },
      { thai: 'ไม่', tone: 'falling' },
    ],
  };

  it('2 từ khác thanh hợp lệ', () => {
    expect(MinimalPairSchema.parse(pair).words).toHaveLength(2);
  });

  it('trùng thanh → lỗi', () => {
    const result = MinimalPairSchema.safeParse({
      ...pair,
      words: [pair.words[0], { thai: 'ไม', tone: 'high' }],
    });
    expect(issuePaths(result)).toContain('words');
  });

  it('ít hơn 2 hoặc nhiều hơn 4 từ → lỗi', () => {
    expect(MinimalPairSchema.safeParse({ ...pair, words: [pair.words[0]] }).success).toBe(false);
    const five = ['mid', 'low', 'falling', 'high', 'rising'].map((tone) => ({ thai: 'มา', tone }));
    expect(MinimalPairSchema.safeParse({ ...pair, words: five }).success).toBe(false);
  });
});

describe('các schema còn lại', () => {
  it('Vowel cần đúng 1 placeholder –', () => {
    const vowel = { id: 'sara-a', form: '–ะ', length: 'short', phonetic: 'a', order: 1 };
    expect(VowelSchema.safeParse(vowel).success).toBe(true);
    expect(VowelSchema.safeParse({ ...vowel, form: 'ะ' }).success).toBe(false);
    expect(VowelSchema.safeParse({ ...vowel, form: '–ะ–' }).success).toBe(false);
  });

  it('Vowel: inherent_final y|m|w cho ไ– ใ– –ำ เ–า (plan 6.2)', () => {
    const ai = { id: 'sara-ai', form: 'ไ–', length: 'short', phonetic: 'ai', order: 5 };
    expect(VowelSchema.parse({ ...ai, inherent_final: 'y' })).toMatchObject({
      inherent_final: 'y',
    });
    expect(VowelSchema.safeParse({ ...ai, inherent_final: 'n' }).success).toBe(false);
  });

  it('ToneMarkEntry chỉ nhận 4 dấu thanh', () => {
    const mark = { id: 'ek', char: '่', name: 'ไม้เอก', order: 1 };
    expect(ToneMarkEntrySchema.safeParse(mark).success).toBe(true);
    expect(ToneMarkEntrySchema.safeParse({ ...mark, char: '็' }).success).toBe(false);
  });

  it('ToneEntry: chao là 2–3 chữ số 1–5', () => {
    const tone = { id: 'mid', label_vi: 'Ngang', chao: '33', order: 1 };
    expect(ToneEntrySchema.safeParse(tone).success).toBe(true);
    expect(ToneEntrySchema.safeParse({ ...tone, chao: '36' }).success).toBe(false);
  });

  it('Deck', () => {
    const deck = { id: 'bai-01', title_vi: 'Bài 1', order: 1 };
    expect(DeckSchema.parse(deck).draft).toBe(false);
    expect(DeckSchema.safeParse({ ...deck, title_vi: '  ' }).success).toBe(false);
  });

  it.each(['noto:1f414', 'noto:1f1fb-1f1f3', 'img/sawatdee.svg', 'img/con-ga/1.png'])(
    'image hợp lệ: %s',
    (value) => {
      expect(ImageSchema.safeParse(value).success).toBe(true);
    },
  );
});
