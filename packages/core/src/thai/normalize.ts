/**
 * Chuẩn hóa chữ Thái trước khi so sánh (G-06): người học có thể gõ dấu theo thứ tự khác
 * (dấu thanh trước nguyên âm trên, `ํ`+`า` thay cho `ำ`…) mà nhìn vẫn giống hệt.
 * NFC không đủ: nguyên âm trên (ิ ี ึ ื ั ็) có combining class 0 nên NFC không sắp xếp lại.
 *
 * Ký tự được khai báo bằng code point (số) để dễ đọc và không lẫn ký tự vô hình trong mã nguồn.
 */

const ch = (code: number) => String.fromCodePoint(code);

const SARA_AA = ch(0x0e32); // า
const SARA_AM = ch(0x0e33); // ำ
const NIKHAHIT = ch(0x0e4d); // ํ

/** Thứ tự chuẩn trong một cụm dấu: nguyên âm trên/dưới → dấu thanh → ์ ๎. */
const MARK_RANK = new Map<string, number>([
  // nguyên âm trên/dưới: ั ิ ี ึ ื ุ ู ฺ ็ ํ
  ...[0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e3a, 0x0e47, 0x0e4d].map(
    (c) => [ch(c), 0] as const,
  ),
  // dấu thanh: ่ ้ ๊ ๋
  ...[0x0e48, 0x0e49, 0x0e4a, 0x0e4b].map((c) => [ch(c), 1] as const),
  // thanthakhat ์, yamakkan ๎
  ...[0x0e4c, 0x0e4e].map((c) => [ch(c), 2] as const),
]);

/** ZWSP, ZWNJ, ZWJ, word joiner, BOM. */
const INVISIBLE = new Set([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff].map(ch));
const TONE_MARKS = new Set([0x0e48, 0x0e49, 0x0e4a, 0x0e4b].map(ch));

function reorderMarks(chars: string[]): string[] {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    // sort ổn định: giữ thứ tự gốc giữa các dấu cùng hạng
    out.push(...run.sort((a, b) => MARK_RANK.get(a)! - MARK_RANK.get(b)!));
    run = [];
  };
  for (const c of chars) {
    if (MARK_RANK.has(c)) {
      run.push(c);
    } else {
      flush();
      out.push(c);
    }
  }
  flush();
  return out;
}

/** `ํ` (+ dấu thanh) + `า` → (dấu thanh) + `ำ`; dấu thanh gõ sau `ำ` → đặt trước `ำ`. */
function composeSaraAm(chars: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]!;
    const next = chars[i + 1];
    if (c === NIKHAHIT && next === SARA_AA) {
      out.push(SARA_AM);
      i += 1;
    } else if (c === NIKHAHIT && next && TONE_MARKS.has(next) && chars[i + 2] === SARA_AA) {
      out.push(next, SARA_AM);
      i += 2;
    } else if (c === SARA_AM && next && TONE_MARKS.has(next)) {
      out.push(next, SARA_AM);
      i += 1;
    } else {
      out.push(c);
    }
  }
  return out;
}

/** Chuẩn hóa chuỗi Thái về một dạng duy nhất. Idempotent. */
export function normalizeThai(text: string): string {
  const chars = [...text.normalize('NFC')].filter((c) => !INVISIBLE.has(c));
  return composeSaraAm(reorderMarks(chars)).join('');
}
