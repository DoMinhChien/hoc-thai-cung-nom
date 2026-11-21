/**
 * Tìm từ ở Sổ từ (SCR-07 §B): khớp đồng thời chữ Thái (`thai`, `thai_alt`) và tiếng Việt
 * (`meaning_vi`, `phonetic`, `note_vi`). Tiếng Việt không phân biệt dấu / hoa thường; chữ Thái chuẩn
 * hóa như chấm gõ, bỏ khoảng trắng.
 */
import { normalizeThai } from '../thai/normalize';

/** Bỏ dấu tiếng Việt, `đ → d`, chữ thường, gộp khoảng trắng. */
export function foldVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const foldThai = (text: string) => normalizeThai(text).replace(/\s+/g, '');
const hasThai = (text: string) => /[฀-๿]/.test(text);

export interface SearchableWord {
  thai: string;
  thai_alt?: readonly string[];
  meaning_vi: readonly string[];
  phonetic?: string | undefined;
  note_vi?: string | undefined;
}

/** Từ có khớp `query` không (chuỗi con sau chuẩn hóa). Rỗng → luôn khớp. */
export function matchesWord(word: SearchableWord, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (hasThai(q)) {
    const needle = foldThai(q);
    return [word.thai, ...(word.thai_alt ?? [])].some((t) => foldThai(t).includes(needle));
  }
  const needle = foldVietnamese(q);
  return [...word.meaning_vi, word.phonetic ?? '', word.note_vi ?? ''].some((t) =>
    foldVietnamese(t).includes(needle),
  );
}

/** Lọc danh sách giữ thứ tự (SCR-07 — hàm thuần, chạy trên mảng trong bộ nhớ). */
export function searchWords<W extends SearchableWord>(words: readonly W[], query: string): W[] {
  return words.filter((w) => matchesWord(w, query));
}
