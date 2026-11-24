/**
 * Luyện nói Mức 2 (SCR-10 §4): so chữ mà nhận dạng giọng nói của trình duyệt nghe được với câu mẫu.
 * Chỉ cho biết "máy nghe ra chữ gì" — **không** chấm thanh điệu / phát âm, không đưa ra điểm %.
 */
import { normalizeThai } from '../thai/normalize';

/** Mục cần nói: `th` + biến thể chấp nhận (`th_alt` của câu, `thai_alt` của từ), thẻ của `th`. */
export interface SpeechTarget {
  /** `th` trước, rồi các biến thể. */
  accepted: readonly string[];
  /** Thẻ của `th` (`tokens` của câu); từ đơn → `[thai]`. Trống → tự tách theo từ. */
  tokens: readonly string[];
}

export interface SpeechMatch {
  /** Bản (`th` hoặc biến thể) khớp nhiều thẻ nhất. */
  variant: string;
  /** Thẻ của bản đó, theo thứ tự trong câu. */
  tokens: string[];
  /** Thẻ nào máy nghe được (cùng độ dài `tokens`). */
  matched: boolean[];
  /** Tỉ lệ thẻ nghe được, 0–1 — chỉ để chọn bản / báo "trọn câu", không hiện ra như điểm. */
  ratio: number;
  /** Lời nhận dạng (alternative) khớp tốt nhất. */
  heard: string;
}

/** Bỏ khoảng trắng, dấu câu, ký tự vô hình (ZWSP…); `ๆ` giữ nguyên (SCR-10 §4). */
export function normalizeSpeech(text: string): string {
  return normalizeThai(text).replace(/[\s\p{P}]/gu, '');
}

/** Tách theo từ (`Intl.Segmenter`, `th`) khi câu không có `tokens`. */
export function segmentThai(text: string): string[] {
  const seg = new Intl.Segmenter('th', { granularity: 'word' });
  return [...seg.segment(text)]
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)
    .filter((s) => normalizeSpeech(s).length > 0);
}

/**
 * Thẻ của một biến thể (`th_alt` không có `tokens` riêng): cắt theo thẻ của `th` — thẻ trùng giữ
 * nguyên, phần chữ khác (vd. ฉัน thay ผม, ค่ะ thay ครับ) gom thành một thẻ.
 */
export function variantTokens(variant: string, tokens: readonly string[]): string[] {
  const known = [...new Set(tokens.map(normalizeSpeech).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  const text = normalizeSpeech(variant);
  const out: string[] = [];
  let other = '';
  let i = 0;
  while (i < text.length) {
    const hit = known.find((k) => text.startsWith(k, i));
    if (hit) {
      if (other) out.push(other);
      other = '';
      out.push(hit);
      i += hit.length;
    } else {
      other += text[i];
      i += 1;
    }
  }
  if (other) out.push(other);
  return out;
}

/** Thẻ nào có trong lời nghe được, theo đúng thứ tự (thẻ không thấy → bỏ qua, xét thẻ sau). */
function alignTokens(tokens: readonly string[], heard: string): boolean[] {
  let pos = 0;
  return tokens.map((token) => {
    const at = heard.indexOf(normalizeSpeech(token), pos);
    if (at < 0) return false;
    pos = at + normalizeSpeech(token).length;
    return true;
  });
}

/**
 * So các alternative nhận dạng được với `th` và mọi biến thể → bản khớp nhiều thẻ nhất (bằng nhau
 * thì ưu tiên `th`, rồi alternative đầu). Không nghe được gì → `null`.
 */
export function matchSpeech(
  transcripts: readonly string[],
  target: SpeechTarget,
): SpeechMatch | null {
  const heardList = transcripts.map((h) => ({ raw: h, norm: normalizeSpeech(h) }));
  if (!heardList.some((h) => h.norm) || target.accepted.length === 0) return null;
  const base = target.tokens.length ? [...target.tokens] : segmentThai(target.accepted[0]!);
  let best: SpeechMatch | null = null;
  for (const [i, variant] of target.accepted.entries()) {
    const tokens = i === 0 ? base : variantTokens(variant, base);
    if (tokens.length === 0) continue;
    for (const h of heardList) {
      // Nghe trọn bản (kể cả khác cách tách thẻ) → khớp đủ.
      const whole = h.norm === normalizeSpeech(variant);
      const matched = whole ? tokens.map(() => true) : alignTokens(tokens, h.norm);
      const ratio = matched.filter(Boolean).length / tokens.length;
      if (!best || ratio > best.ratio) best = { variant, tokens, matched, ratio, heard: h.raw };
    }
  }
  return best;
}
