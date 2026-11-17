import { describe, expect, it } from 'vitest';
import {
  AudioSchema,
  ConsonantSchema,
  DialogueSchema,
  GrammarSchema,
  ImageSchema,
  LessonSchema,
  SentenceSchema,
  SyllableAnalysisSchema,
  ToneEntrySchema,
  ToneMarkEntrySchema,
  UnitSchema,
  VowelSchema,
  WordSchema,
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

  it.each(['noto:1f414', 'noto:1f1fb-1f1f3', 'img/sawatdee.svg', 'img/con-ga/1.png'])(
    'image hợp lệ: %s',
    (value) => {
      expect(ImageSchema.safeParse(value).success).toBe(true);
    },
  );
});

// v7 (plan 0.9): một dòng mỗi file mẫu, ô CSV là chuỗi.
const unit = {
  unit_id: 'u01',
  level: 'A1',
  order: '1',
  title_vi: 'Chào hỏi',
  title_th: 'ทักทาย',
  can_do: 'Chào hỏi | Giới thiệu tên',
  draft: 'true',
};
const lesson = {
  lesson_id: 'u01-l1',
  unit_id: 'u01',
  order: '1',
  title_vi: 'Xin chào',
  grammar_ids: 'g-khrap|g-chue',
};
const word = {
  id: 'sawatdee',
  unit_id: 'u01',
  lesson_id: 'u01-l1',
  thai: 'สวัสดี',
  meaning_vi: 'xin chào; tạm biệt',
  pos: 'interj',
  phonetic: 'sa-wat-di',
  example_th: '',
  example_vi: '',
  image: 'noto:1f44b',
  tags: 'polite;common',
  source: 'giao-trinh-a.pdf#p12',
};
const sentence = {
  id: 's-u01-001',
  unit_id: 'u01',
  lesson_id: 'u01-l1',
  vi: 'Tôi tên là Nam.',
  th: 'ผมชื่อนาม',
  th_alt: 'ผมชื่อนามครับ',
  tokens: 'ผม|ชื่อ|นาม',
  distractors: 'คุณ',
  grammar_id: 'g-chue',
  audio: '',
  source: '',
};

describe('UnitSchema', () => {
  it('parse: order → số, can_do tách |, draft', () => {
    expect(UnitSchema.parse(unit)).toEqual({
      unit_id: 'u01',
      level: 'A1',
      order: 1,
      title_vi: 'Chào hỏi',
      title_th: 'ทักทาย',
      can_do: ['Chào hỏi', 'Giới thiệu tên'],
      draft: true,
    });
  });

  it('title_th tùy chọn; draft trống = false', () => {
    expect(UnitSchema.parse({ ...unit, title_th: '', draft: '' })).toMatchObject({
      title_th: undefined,
      draft: false,
    });
  });

  it.each([
    ['level', { level: 'B1' }],
    ['order', { order: '0' }],
    ['order', { order: '1.5' }],
    ['title_th', { title_th: 'Chao' }],
    ['can_do', { can_do: ' | ' }],
    ['draft', { draft: 'yes' }],
    ['', { deck: 'x' }],
  ])('bắt lỗi %s', (path, patch) => {
    expect(issuePaths(UnitSchema.safeParse({ ...unit, ...patch }))).toContain(path);
  });
});

describe('LessonSchema', () => {
  it('grammar_ids tách |, trống → []', () => {
    expect(LessonSchema.parse(lesson).grammar_ids).toEqual(['g-khrap', 'g-chue']);
    expect(LessonSchema.parse({ ...lesson, grammar_ids: '' }).grammar_ids).toEqual([]);
  });

  it('grammar_ids sai dạng id → lỗi', () => {
    expect(issuePaths(LessonSchema.safeParse({ ...lesson, grammar_ids: 'G 1' }))).toContain(
      'grammar_ids.0',
    );
  });
});

describe('WordSchema', () => {
  it('parse: nghĩa/tags tách ;, ô trống → undefined', () => {
    const w = WordSchema.parse(word);
    expect(w.meaning_vi).toEqual(['xin chào', 'tạm biệt']);
    expect(w.tags).toEqual(['polite', 'common']);
    expect(w.example_th).toBeUndefined();
    expect(w.draft).toBe(false);
  });

  it('phonetic và cột tùy chọn có thể vắng', () => {
    const w = WordSchema.parse({
      id: 'di',
      unit_id: 'u01',
      lesson_id: 'u01-l1',
      thai: 'ดี',
      meaning_vi: 'tốt',
    });
    expect(w.phonetic).toBeUndefined();
    expect(w.image).toBeUndefined();
    expect(w.tags).toEqual([]);
  });

  it.each([
    ['meaning_vi', { meaning_vi: ' ; ' }],
    ['thai', { thai: 'sawatdee' }],
    ['phonetic', { phonetic: 'sà-wàt-dii' }],
    ['image', { image: 'http://x/y.png' }],
    ['example_th', { example_th: 'hello' }],
    ['unit_id', { unit_id: 'Unit 1' }],
  ])('bắt lỗi %s', (path, patch) => {
    expect(issuePaths(WordSchema.safeParse({ ...word, ...patch }))).toContain(path);
  });

  it('v7: cột cũ deck/syllables/tones không còn hợp lệ', () => {
    const result = WordSchema.safeParse({ ...word, deck: 'bai-01', tones: 'mid' });
    expect(result.error?.issues[0]).toMatchObject({
      code: 'unrecognized_keys',
      keys: ['deck', 'tones'],
    });
  });
});

describe('SentenceSchema', () => {
  it('parse: th_alt/tokens/distractors tách |', () => {
    expect(SentenceSchema.parse(sentence)).toMatchObject({
      th_alt: ['ผมชื่อนามครับ'],
      tokens: ['ผม', 'ชื่อ', 'นาม'],
      distractors: ['คุณ'],
      grammar_id: 'g-chue',
      audio: undefined,
      draft: false,
    });
  });

  it('th_alt/distractors/grammar_id tùy chọn', () => {
    expect(
      SentenceSchema.parse({ ...sentence, th_alt: '', distractors: '', grammar_id: '' }),
    ).toMatchObject({ th_alt: [], distractors: [], grammar_id: undefined });
  });

  it.each([
    ['tokens', { tokens: '' }],
    ['tokens.1', { tokens: 'ผม|name' }],
    ['th', { th: 'Toi ten la Nam' }],
    ['th_alt.0', { th_alt: 'abc' }],
    ['audio', { audio: 'x.mp3' }],
    ['vi', { vi: ' ' }],
  ])('bắt lỗi %s', (path, patch) => {
    expect(issuePaths(SentenceSchema.safeParse({ ...sentence, ...patch }))).toContain(path);
  });

  it.each(['audio/s-u01-001.mp3', 'audio/u01/a.m4a'])('audio hợp lệ: %s', (value) => {
    expect(AudioSchema.safeParse(value).success).toBe(true);
  });
});

describe('GrammarSchema / DialogueSchema', () => {
  const grammar = {
    id: 'g-chue',
    unit_id: 'u01',
    title_vi: 'Nói tên',
    pattern: 'ชื่อ + tên',
    explain_vi: 'Dùng ชื่อ để nói tên.',
    examples: [{ th: 'ผมชื่อนาม', vi: 'Tôi tên là Nam.' }],
  };
  const dialogue = {
    id: 'd-u01-l1',
    lesson_id: 'u01-l1',
    lines: [
      { speaker: 'A', th: 'สวัสดีครับ', vi: 'Xin chào.' },
      { speaker: 'B', th: 'สวัสดีค่ะ', vi: 'Xin chào.' },
    ],
  };

  it('parse mẫu, draft mặc định false', () => {
    expect(GrammarSchema.parse(grammar).draft).toBe(false);
    expect(DialogueSchema.parse({ ...dialogue, draft: true }).lines).toHaveLength(2);
  });

  it.each([
    ['examples', { examples: [] }],
    ['examples.0.th', { examples: [{ th: 'abc', vi: 'x' }] }],
    ['pattern', { pattern: '' }],
  ])('Grammar bắt lỗi %s', (path, patch) => {
    expect(issuePaths(GrammarSchema.safeParse({ ...grammar, ...patch }))).toContain(path);
  });

  it.each([
    ['lines', { lines: [] }],
    ['lines.0.speaker', { lines: [{ speaker: '', th: 'ดี', vi: 'tốt' }] }],
    ['lines.0', { lines: [{ speaker: 'A', th: 'ดี', vi: 'tốt', note: 'x' }] }],
  ])('Dialogue bắt lỗi %s', (path, patch) => {
    expect(issuePaths(DialogueSchema.safeParse({ ...dialogue, ...patch }))).toContain(path);
  });
});
