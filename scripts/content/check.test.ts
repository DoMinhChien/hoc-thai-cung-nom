import { describe, expect, it } from 'vitest';
import { checkContent, splitWords } from './check';
import {
  CONTENT_KINDS,
  emptyContentSet,
  type ContentItem,
  type ContentKind,
  type ContentSet,
} from './load';

// Mẫu tối thiểu theo plan 5.5, chỉ để test quy tắc — không phải nội dung học.
const at = <K extends ContentKind>(kind: K, value: unknown, file: string, line = 1) => ({
  value: CONTENT_KINDS[kind].parse(value) as ContentItem<K>,
  file,
  line,
});

function setOf(patch: Partial<{ [K in ContentKind]: unknown[] }>): ContentSet {
  const set = emptyContentSet();
  for (const [kind, values] of Object.entries(patch) as [ContentKind, unknown[]][]) {
    (set[kind] as unknown[]) = values.map((v, i) => at(kind, v, `${kind}.file`, i + 1));
  }
  return set;
}

const deck = { id: 'bai-01', title_vi: 'Bài 1', order: 1 };
const word = (id: string, thai: string, extra: object = {}) => ({
  id,
  thai,
  phonetic: 'x',
  syllables: thai,
  tones: 'mid',
  meaning_vi: 'nghĩa',
  deck: 'bai-01',
  ...extra,
});
const consonant = (id: string, char: string, cls: string) => ({
  id,
  char,
  name: `${char} ชื่อ`,
  class: cls,
  initial: 'k',
  phonetic: 'k',
  keyword_vi: 'x',
  order: 1,
});
const drill = (patch: object) => ({
  id: 'mai-1',
  thai: 'ไม่',
  initial_char: 'ม',
  vowel_length: 'short',
  final_sound: 'y',
  tone_mark: 'ek',
  expected_tone: 'falling',
  ...patch,
});
const reading = (sentences: string[], id = 'lvl1-001') => ({
  id,
  title_vi: 'Bài',
  level: 1,
  sentences: sentences.map((th) => ({ th, vi: 'x' })),
});

const summary = (set: ContentSet) =>
  checkContent(set).map((i) => `${i.severity} ${i.file}:${i.line} [${i.field ?? ''}] ${i.message}`);

describe('checkContent', () => {
  it('content hợp lệ → không có issue', () => {
    const set = setOf({
      decks: [deck],
      words: [word('di', 'ดี'), word('mai', 'ไม่')],
      consonants: [consonant('ko-kai', 'ก', 'mid')],
      toneDrills: [drill({})],
      readings: [reading(['ดี|ไม่'])],
    });
    expect(checkContent(set)).toEqual([]);
  });

  it('id trùng trong cùng loại → lỗi chỉ về mục đầu; khác loại thì không sao', () => {
    const set = setOf({
      decks: [deck, { ...deck, order: 2 }],
      words: [word('bai-01', 'ดี')],
    });
    expect(summary(set)).toEqual([
      'error decks.file:2 [id] id "bai-01" trùng với deck ở decks.file:1',
    ]);
  });

  it('id bài đọc trùng giữa hai file', () => {
    const set = emptyContentSet();
    set.readings = [
      at('readings', reading(['ดี']), 'readings/a.yaml'),
      at('readings', reading(['ดี']), 'readings/b.yaml'),
    ];
    set.words = [at('words', word('di', 'ดี'), 'words.csv', 2)];
    set.decks = [at('decks', deck, 'decks.yaml')];
    expect(summary(set)).toEqual([
      'error readings/b.yaml:1 [id] id "lvl1-001" trùng với bài đọc ở readings/a.yaml:1',
    ]);
  });

  it('deck không tồn tại', () => {
    const set = setOf({ decks: [deck], words: [word('di', 'ดี', { deck: 'bai-99' })] });
    expect(summary(set)).toEqual([
      'error words.file:1 [deck] deck "bai-99" không có trong vocab/decks.yaml',
    ]);
  });

  it('lớp phụ âm khác consonantClass()', () => {
    const set = setOf({ consonants: [consonant('kho-khai', 'ข', 'low')] });
    expect(summary(set)).toEqual([
      'error consonants.file:1 [class] ข thuộc lớp high, không phải low',
    ]);
  });

  it('Tone Engine khác expected_tone', () => {
    const set = setOf({ toneDrills: [drill({ expected_tone: 'high' })] });
    expect(summary(set)).toEqual([
      'error toneDrills.file:1 [expected_tone] Tone Engine tính ra "falling" (quy tắc low:ek) nhưng expected_tone là "high"',
    ]);
  });

  it.each([
    [{ thai: 'สข', initial_char: 'ข', leading: 'ส' }, 'leading'],
    [{ initial_char: 'ข', tone_mark: 'tri', expected_tone: 'high' }, 'tone_mark'],
  ])('Tone Engine không tính được → lỗi ở trường gây ra (%o)', (patch, field) => {
    const [issue] = checkContent(setOf({ toneDrills: [drill(patch)] }));
    expect(issue).toMatchObject({ severity: 'error', field });
  });

  it('อักษรนำ: วัส (สวัสดี) theo lớp của ส → khớp expected_tone low', () => {
    const wat = { thai: 'วัส', initial_char: 'ว', leading: 'ส', final_sound: 't', tone_mark: null };
    expect(summary(setOf({ toneDrills: [drill({ ...wat, expected_tone: 'low' })] }))).toEqual([]);
  });

  it('ไ/ใ/ำ/เา ghi vowel_length long hoặc thiếu final_sound → cảnh báo (T2.1.4)', () => {
    const set = setOf({
      toneDrills: [
        drill({ vowel_length: 'long', final_sound: null }),
        drill({ id: 'khao', thai: 'เขา', initial_char: 'ข', final_sound: 'm', tone_mark: null, expected_tone: 'rising' }),
      ],
    });
    const rule = (f: string) =>
      `ไ– ใ– –ำ เ–า là nguyên âm ngắn + âm cuối vang (plan 6.2): ghi vowel_length: short, final_sound: ${f}`;
    expect(summary(set)).toEqual([
      `warning toneDrills.file:1 [vowel_length] ${rule('y')}`,
      `warning toneDrills.file:1 [final_sound] ${rule('y')}`,
      `warning toneDrills.file:2 [final_sound] ${rule('w')}`,
    ]);
  });

  it('tone_override: không đối chiếu Tone Engine, không cảnh báo', () => {
    const exception = drill({ vowel_length: 'long', expected_tone: 'mid', tone_override: true });
    expect(checkContent(setOf({ toneDrills: [exception] }))).toEqual([]);
  });

  it('cảnh báo kèm lỗi khi Tone Engine không tính được', () => {
    const set = setOf({ toneDrills: [drill({ final_sound: null, tone_mark: 'tri', initial_char: 'ข', thai: 'ไข๊' })] });
    expect(checkContent(set).map((i) => [i.severity, i.field])).toEqual([
      ['error', 'tone_mark'],
      ['warning', 'final_sound'],
    ]);
  });

  it('nguyên âm inherent_final phải ngắn', () => {
    const ai = { id: 'sara-ai', form: 'ไ–', length: 'long', inherent_final: 'y', phonetic: 'ai', order: 1 };
    expect(summary(setOf({ vowels: [ai] }))).toEqual([
      'error vowels.file:1 [length] nguyên âm có âm cuối sẵn (inherent_final) là nguyên âm ngắn (plan 6.2)',
    ]);
  });

  it('cảnh báo ký tự ngoài bảng Thái (kể cả trong từng âm tiết, câu, cặp tối thiểu)', () => {
    const set = setOf({
      decks: [deck],
      words: [word('di', 'ดีa', { syllables: 'ดีa' })],
      minimalPairs: [
        {
          id: 'p1',
          words: [
            { thai: 'ไม้!', tone: 'high' },
            { thai: 'ไม่', tone: 'falling' },
          ],
        },
      ],
      vowels: [{ id: 'sara-a', form: '–ะ', length: 'short', phonetic: 'a', order: 1 }],
    });
    expect(summary(set)).toEqual([
      'warning words.file:1 [thai] ký tự ngoài bảng chữ Thái: "a" (U+0061)',
      'warning words.file:1 [syllables.0] ký tự ngoài bảng chữ Thái: "a" (U+0061)',
      'warning minimalPairs.file:1 [words.0.thai] ký tự ngoài bảng chữ Thái: "!" (U+0021)',
    ]);
  });

  it('cảnh báo từ trong bài đọc chưa có trong lexicon — mỗi từ một lần mỗi bài', () => {
    const set = setOf({
      decks: [deck],
      words: [word('di', 'ดี')],
      readings: [reading(['ดี|มาก', 'มาก|ดี'])],
    });
    expect(summary(set)).toEqual([
      'warning readings.file:1 [sentences.0.th] từ "มาก" chưa có trong lexicon (vocab/words.csv)',
    ]);
  });

  it('gộp cảnh báo draft theo file', () => {
    const set = setOf({ decks: [{ ...deck, draft: true }] });
    set.words = [
      at('words', word('di', 'ดี', { draft: 'true' }), 'words.csv', 2),
      at('words', word('mai', 'ไม่', { draft: 'true' }), 'words.csv', 3),
      at('words', word('ma', 'มา'), 'words.csv', 4),
    ];
    expect(summary(set)).toEqual([
      'warning decks.file:1 [] 1 mục draft: true — chưa được owner duyệt',
      'warning words.csv:2 [] 2 mục draft: true — chưa được owner duyệt',
    ]);
  });
});

describe('splitWords', () => {
  it('theo | khi owner đặt ranh giới (bỏ khoảng trắng, dấu câu)', () => {
    expect(splitWords('สวัสดี|ครับ ไป|ไหน ?')).toEqual(['สวัสดี', 'ครับ', 'ไป', 'ไหน']);
  });
  it('không có | → Intl.Segmenter tách từ', () => {
    const words = splitWords('สวัสดีครับ');
    expect(words.join('')).toBe('สวัสดีครับ');
    expect(words.length).toBeGreaterThan(1);
  });
});
