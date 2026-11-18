import { normalizeThai } from './normalize';

/**
 * Chấm câu gõ chữ Thái (G-06, E-07, E-12). So với danh sách đáp án chấp nhận (`th` + `th_alt`) sau
 * chuẩn hóa: `normalizeThai`, bỏ khoảng trắng + dấu câu, ครับ/ค่ะ/คะ cuối mỗi cụm là tùy chọn.
 */

export type TypingVerdict = 'correct' | 'tone' | 'wrong';

/** Một đoạn diff theo cụm ký tự: `extra` = người học gõ thừa/sai, `missing` = đáp án có mà thiếu. */
export interface DiffPart {
  kind: 'same' | 'extra' | 'missing';
  text: string;
}

export interface TypingResult {
  /** `tone`: chỉ sai dấu thanh (่ ้ ๊ ๋). */
  verdict: TypingVerdict;
  /** Đáp án chấp nhận gần bài làm nhất (nguyên văn) — để hiện "đáp án đúng". */
  answer: string;
  /** Bài làm so với `answer` (đã chuẩn hóa, bỏ khoảng trắng, ครับ/ค่ะ/คะ); đúng → `[]`. */
  diff: DiffPart[];
}

/** Từ lịch sự cuối câu, người học thêm hay bỏ đều được (E-07). Dài trước để regex ưu tiên. */
export const POLITE_PARTICLES = ['ครับ', 'ค่ะ', 'คะ'] as const;

const TONE_MARKS = /[่-๋]/g;
/** Dấu câu ASCII + ngoặc kép/… kiểu chữ. Giữ ฯ ๆ (là chữ). */
const PUNCTUATION = /[!-/:-@[-`{-~‘’“”…–—]/g;

const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' });
const splitGraphemes = (text: string) => [...graphemes.segment(text)].map((s) => s.segment);

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripTones = (text: string) => text.replace(TONE_MARKS, '');

/** Các cụm (ngăn bởi khoảng trắng) đã bỏ dấu câu và ครับ/ค่ะ/คะ ở cuối; cụm rỗng bị bỏ. */
function segments(text: string, mapChars: (s: string) => string): string[] {
  const particles = POLITE_PARTICLES.map(mapChars);
  return mapChars(normalizeThai(text))
    .split(/\s+/)
    .map((segment) => {
      const bare = segment.replace(PUNCTUATION, '');
      const particle = particles.find((p) => bare.endsWith(p));
      return particle ? bare.slice(0, -particle.length) : bare;
    })
    .filter(Boolean);
}

/** Bài làm khớp đáp án nếu chèn/bỏ ครับ/ค่ะ/คะ sau mỗi cụm của đáp án (người học có thể gõ liền). */
function matches(input: string, answer: string, mapChars: (s: string) => string): boolean {
  const parts = segments(answer, mapChars);
  if (parts.length === 0) return false;
  const particle = `(?:${POLITE_PARTICLES.map((p) => escapeRegex(mapChars(p))).join('|')})?`;
  const pattern = new RegExp(`^${parts.map((p) => escapeRegex(p) + particle).join('')}$`, 'u');
  const typed = mapChars(normalizeThai(input)).replace(/\s+/g, '').replace(PUNCTUATION, '');
  return pattern.test(typed);
}

/** Diff theo cụm ký tự (grapheme, để dấu không đứng lẻ) bằng LCS. */
export function diffThai(input: string, expected: string): DiffPart[] {
  const a = splitGraphemes(input);
  const b = splitGraphemes(expected);
  // lcs[i][j] = độ dài LCS của a[i:] và b[j:]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i]![j] =
        a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }
  const parts: DiffPart[] = [];
  const push = (kind: DiffPart['kind'], text: string) => {
    const last = parts.at(-1);
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push('same', a[i++]!);
      j++;
    } else if (j >= b.length || (i < a.length && lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) {
      push('extra', a[i++]!);
    } else {
      push('missing', b[j++]!);
    }
  }
  return parts;
}

const canonical = (text: string) => segments(text, (s) => s).join('');
const editCost = (diff: DiffPart[]) =>
  diff.reduce((n, p) => n + (p.kind === 'same' ? 0 : splitGraphemes(p.text).length), 0);

/** Đáp án chấp nhận của một câu (E-07): `th` + `th_alt`. */
export function acceptedAnswers(sentence: { th?: string | undefined; th_alt: string[] }): string[] {
  return [sentence.th, ...sentence.th_alt].filter((s): s is string => !!s?.trim());
}

/** Chấm bài gõ `input` theo các đáp án `accepted` (ít nhất 1). */
export function gradeThaiTyping(input: string, accepted: readonly string[]): TypingResult {
  const answers = accepted.filter((a) => a.trim());
  if (answers.length === 0) throw new Error('gradeThaiTyping: cần ít nhất một đáp án');

  const exact = answers.find((a) => matches(input, a, (s) => s));
  if (exact) return { verdict: 'correct', answer: exact, diff: [] };

  const typed = canonical(input);
  const diffOf = (answer: string) => diffThai(typed, canonical(answer));
  const toneOnly = answers.find((a) => matches(input, a, stripTones));
  if (toneOnly) return { verdict: 'tone', answer: toneOnly, diff: diffOf(toneOnly) };

  const ranked = answers
    .map((answer) => ({ answer, diff: diffOf(answer) }))
    .sort((x, y) => editCost(x.diff) - editCost(y.diff));
  const best = ranked[0]!;
  return { verdict: 'wrong', answer: best.answer, diff: best.diff };
}
