import { describe, expect, it } from 'vitest';
import { KEDMANEE_ROWS, kedmaneeChar } from './kedmanee';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i));

const all = KEDMANEE_ROWS.flat().flatMap((k) => [k.normal, k.shift]);

describe('Kedmanee TIS 820-2538 (G-06)', () => {
  it('4 hàng 13/13/11/10 phím, mỗi phím đúng 1 ký tự', () => {
    expect(KEDMANEE_ROWS.map((row) => row.length)).toEqual([13, 13, 11, 10]);
    for (const c of all) expect([...c]).toHaveLength(1);
  });

  it('không ký tự nào nằm ở 2 vị trí', () => {
    expect(new Set(all).size).toBe(all.length);
  });

  it('đủ phụ âm ก–ฮ, nguyên âm, dấu thanh, chữ số Thái, ฯ ๆ ฿', () => {
    const needed = [
      ...range(0x0e01, 0x0e2e), // ก–ฮ (gồm ฤ ฦ)
      ...range(0x0e30, 0x0e3a), // ะ ั า ำ ิ ี ึ ื ุ ู ฺ
      ...range(0x0e40, 0x0e44), // เ แ โ ใ ไ
      ...range(0x0e47, 0x0e4d), // ็ ่ ้ ๊ ๋ ์ ํ
      ...range(0x0e50, 0x0e59), // ๐–๙
      'ฯ',
      'ๆ',
      '฿',
    ];
    expect(needed.filter((c) => !all.includes(c))).toEqual([]);
  });

  it('kedmaneeChar: phím thường / Shift / ngoài bảng', () => {
    expect(kedmaneeChar('KeyD', false)).toBe('ก');
    expect(kedmaneeChar('KeyJ', false)).toBe('่');
    expect(kedmaneeChar('KeyU', true)).toBe('๊');
    expect(kedmaneeChar('Digit2', true)).toBe('๑');
    expect(kedmaneeChar('Space', false)).toBeUndefined();
  });
});
