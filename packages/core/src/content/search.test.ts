import { describe, expect, it } from 'vitest';
import { foldVietnamese, matchesWord, searchWords } from './search';

// Dữ liệu GIẢ LẬP cho test tìm kiếm — không phải nội dung học.
const WORDS = [
  { thai: 'แมว', meaning_vi: ['con mèo'], phonetic: 'maeo' },
  { thai: 'ขอบคุณ', thai_alt: ['ขอบใจ'], meaning_vi: ['cảm ơn'] },
  { thai: 'ผู้หญิง', meaning_vi: ['phụ nữ'], note_vi: 'Đàn bà' },
];

describe('tìm từ ở Sổ từ (SCR-07 §B)', () => {
  it('tiếng Việt không dấu, không phân biệt hoa thường, đ → d', () => {
    expect(foldVietnamese('  Cảm   ƠN ')).toBe('cam on');
    expect(searchWords(WORDS, 'meo').map((w) => w.thai)).toEqual(['แมว']);
    expect(searchWords(WORDS, 'cam on').map((w) => w.thai)).toEqual(['ขอบคุณ']);
    expect(searchWords(WORDS, 'dan ba').map((w) => w.thai)).toEqual(['ผู้หญิง']);
    expect(matchesWord(WORDS[0]!, 'MAEO')).toBe(true);
  });

  it('chữ Thái: chuỗi con, khớp cả thai_alt, có dấu thanh, bỏ khoảng trắng', () => {
    expect(searchWords(WORDS, 'ขอบ ใจ').map((w) => w.thai)).toEqual(['ขอบคุณ']);
    expect(searchWords(WORDS, 'หญิง').map((w) => w.thai)).toEqual(['ผู้หญิง']);
    expect(searchWords(WORDS, 'หมา')).toEqual([]);
  });

  it('rỗng → giữ nguyên danh sách', () => {
    expect(searchWords(WORDS, '  ')).toHaveLength(3);
  });
});
