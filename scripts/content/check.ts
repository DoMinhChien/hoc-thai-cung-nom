/**
 * Kiểm tra chéo sau khi loader đã parse schema (plan 5.6): id duy nhất, deck tồn tại,
 * Tone Engine khớp tone-drills (trừ `tone_override`), lớp phụ âm khớp `consonantClass()`,
 * nguyên âm có âm cuối sẵn phải ngắn; cảnh báo âm tiết ไ/ใ/ำ/เา ghi sai độ dài/âm cuối, ký tự
 * ngoài bảng Thái, từ trong bài đọc chưa có trong lexicon, mục `draft: true`.
 */
import {
  computeTone,
  consonantClass,
  inherentFinal,
  normalizeThai,
  type ToneError,
} from '@nom/core';
import type { ContentIssue, ContentKind, ContentSet, Located } from './load';

/** Tên file hiển thị khi báo lỗi theo loại (id trùng giữa các file bài đọc…). */
const KIND_LABEL: Record<ContentKind, string> = {
  consonants: 'phụ âm',
  vowels: 'nguyên âm',
  toneMarks: 'dấu thanh',
  tones: 'thanh',
  toneDrills: 'tone-drill',
  decks: 'deck',
  words: 'từ',
  readings: 'bài đọc',
  minimalPairs: 'cặp tối thiểu',
};

export function checkContent(content: ContentSet): ContentIssue[] {
  return [
    ...checkUniqueIds(content),
    ...checkDecks(content),
    ...checkConsonantClasses(content),
    ...checkInherentFinalVowels(content),
    ...checkToneDrills(content),
    ...checkThaiCharacters(content),
    ...checkReadingLexicon(content),
    ...checkDrafts(content),
  ];
}

const issueAt =
  (severity: ContentIssue['severity']) =>
  (item: Located<unknown>, field: string | undefined, message: string): ContentIssue => ({
    severity,
    file: item.file,
    line: item.line,
    field,
    message,
  });
const error = issueAt('error');
const warning = issueAt('warning');

function checkUniqueIds(content: ContentSet): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const kind of Object.keys(content) as ContentKind[]) {
    const seen = new Map<string, Located<unknown>>();
    for (const item of content[kind] as Located<{ id: string }>[]) {
      const first = seen.get(item.value.id);
      if (first) {
        issues.push(
          error(
            item,
            'id',
            `id "${item.value.id}" trùng với ${KIND_LABEL[kind]} ở ${first.file}:${first.line}`,
          ),
        );
      } else {
        seen.set(item.value.id, item);
      }
    }
  }
  return issues;
}

function checkDecks(content: ContentSet): ContentIssue[] {
  const decks = new Set(content.decks.map((d) => d.value.id));
  return content.words
    .filter((w) => !decks.has(w.value.deck))
    .map((w) => error(w, 'deck', `deck "${w.value.deck}" không có trong vocab/decks.yaml`));
}

function checkConsonantClasses(content: ContentSet): ContentIssue[] {
  return content.consonants.flatMap((c) => {
    const expected = consonantClass(c.value.char);
    return expected === c.value.class
      ? []
      : [error(c, 'class', `${c.value.char} thuộc lớp ${expected}, không phải ${c.value.class}`)];
  });
}

const TONE_ERROR_FIELD: Record<ToneError, string> = {
  'unknown-consonant': 'initial_char',
  'invalid-leading': 'leading',
  'invalid-tone-mark': 'tone_mark',
};
const TONE_ERROR_MESSAGE: Record<ToneError, string> = {
  'unknown-consonant': 'Tone Engine không nhận ra phụ âm đầu',
  'invalid-leading':
    'phụ âm dẫn không hợp lệ: phải là phụ âm cao/trung đứng trước phụ âm thấp đơn (ง ญ ณ น ม ย ร ล ว ฬ) — ngoại lệ đọc tách: leading: null + tone_override',
  'invalid-tone-mark': 'dấu thanh này không dùng được với lớp phụ âm (ô "—" bảng 6.3)',
};

/** Vowel ไ– ใ– –ำ เ–า (`inherent_final`) là nguyên âm ngắn (plan 6.2). */
function checkInherentFinalVowels(content: ContentSet): ContentIssue[] {
  return content.vowels
    .filter((v) => v.value.inherent_final && v.value.length !== 'short')
    .map((v) =>
      error(v, 'length', 'nguyên âm có âm cuối sẵn (inherent_final) là nguyên âm ngắn (plan 6.2)'),
    );
}

/** T2.1.4: âm tiết ไ/ใ/ำ/เา ghi `long` hoặc thiếu/sai `final_sound` → Tone Trainer giải thích sai. */
function inherentFinalWarnings(d: ContentSet['toneDrills'][number]): ContentIssue[] {
  const inherent = inherentFinal(d.value.thai);
  if (!inherent) return [];
  const rule = `ไ– ใ– –ำ เ–า là nguyên âm ngắn + âm cuối vang (plan 6.2): ghi vowel_length: short, final_sound: ${inherent}`;
  const issues: ContentIssue[] = [];
  if (d.value.vowel_length === 'long') issues.push(warning(d, 'vowel_length', rule));
  if (d.value.final_sound !== inherent) issues.push(warning(d, 'final_sound', rule));
  return issues;
}

function checkToneDrills(content: ContentSet): ContentIssue[] {
  return content.toneDrills.flatMap((d) => {
    // Ngoại lệ đã biết (từ mượn…): tin expected_tone, không đối chiếu Tone Engine.
    if (d.value.tone_override) return [];
    const warnings = inherentFinalWarnings(d);
    const result = computeTone(d.value);
    if (!result.ok) {
      return [
        error(d, TONE_ERROR_FIELD[result.error], TONE_ERROR_MESSAGE[result.error]),
        ...warnings,
      ];
    }
    if (result.tone === d.value.expected_tone) return warnings;
    return [
      ...warnings,
      error(
        d,
        'expected_tone',
        `Tone Engine tính ra "${result.tone}" (quy tắc ${result.rule}) nhưng expected_tone là "${d.value.expected_tone}"`,
      ),
    ];
  });
}

/** Ngoài bảng Thai Unicode, chỉ cho phép `|` (ranh giới từ) và khoảng trắng. */
const NON_THAI = /[^\u0E00-\u0E7F|\s]/gu;

/** Các trường chữ Thái của mỗi loại: [tên trường, giá trị]. */
function thaiFields(content: ContentSet): [Located<unknown>, string, string][] {
  const out: [Located<unknown>, string, string][] = [];
  const add = (item: Located<unknown>, field: string, value: string | undefined) => {
    if (value !== undefined) out.push([item, field, value]);
  };
  for (const c of content.consonants) {
    add(c, 'char', c.value.char);
    add(c, 'name', c.value.name);
  }
  // `–` là chỗ của phụ âm trong form nguyên âm.
  for (const v of content.vowels) add(v, 'form', v.value.form.replaceAll('–', ''));
  for (const m of content.toneMarks) add(m, 'name', m.value.name);
  for (const d of content.toneDrills) add(d, 'thai', d.value.thai);
  for (const w of content.words) {
    add(w, 'thai', w.value.thai);
    w.value.syllables.forEach((s, i) => add(w, `syllables.${i}`, s));
    add(w, 'example_th', w.value.example_th);
  }
  for (const r of content.readings) {
    r.value.sentences.forEach((s, i) => add(r, `sentences.${i}.th`, s.th));
  }
  for (const p of content.minimalPairs) {
    p.value.words.forEach((w, i) => add(p, `words.${i}.thai`, w.thai));
  }
  return out;
}

function checkThaiCharacters(content: ContentSet): ContentIssue[] {
  return thaiFields(content).flatMap(([item, field, value]) => {
    const bad = [...new Set(value.match(NON_THAI) ?? [])];
    if (bad.length === 0) return [];
    const shown = bad.map(
      (c) => `"${c}" (U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')})`,
    );
    return [warning(item, field, `ký tự ngoài bảng chữ Thái: ${shown.join(', ')}`)];
  });
}

const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
const HAS_THAI = /[\u0E00-\u0E7F]/u;

/** Tách câu thành từ: theo `|` nếu owner đã đặt ranh giới, ngược lại `Intl.Segmenter`. */
export function splitWords(sentence: string): string[] {
  const parts = sentence.includes('|')
    ? sentence.split(/[|\s]+/)
    : [...segmenter.segment(sentence)].filter((s) => s.isWordLike).map((s) => s.segment);
  return parts.map((p) => p.trim()).filter((p) => HAS_THAI.test(p));
}

function checkReadingLexicon(content: ContentSet): ContentIssue[] {
  const lexicon = new Set(content.words.map((w) => normalizeThai(w.value.thai)));
  return content.readings.flatMap((r) => {
    const reported = new Set<string>();
    return r.value.sentences.flatMap((s, i) =>
      splitWords(s.th)
        .filter((word) => !lexicon.has(word) && !reported.has(word) && reported.add(word))
        .map((word) =>
          warning(r, `sentences.${i}.th`, `từ "${word}" chưa có trong lexicon (vocab/words.csv)`),
        ),
    );
  });
}

/** Gộp một cảnh báo cho mỗi file để không lấn át lỗi thật. */
function checkDrafts(content: ContentSet): ContentIssue[] {
  const byFile = new Map<string, { first: Located<unknown>; count: number }>();
  for (const items of Object.values(content) as Located<{ draft: boolean }>[][]) {
    for (const item of items) {
      if (!item.value.draft) continue;
      const entry = byFile.get(item.file);
      if (entry) entry.count += 1;
      else byFile.set(item.file, { first: item, count: 1 });
    }
  }
  return [...byFile.values()].map(({ first, count }) =>
    warning(first, undefined, `${count} mục draft: true — chưa được owner duyệt`),
  );
}
