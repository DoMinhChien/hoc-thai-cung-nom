import { describe, expect, it } from 'vitest';
import { normalizeThai } from './normalize';

// Dựng chuỗi bằng mã code point để thấy rõ thứ tự ký tự (mắt thường nhìn giống nhau).
const s = (...codes: number[]) => String.fromCodePoint(...codes);
const NO = 0x0e19; // น
const PO = 0x0e1b; // ป
const KO = 0x0e01; // ก
const THO = 0x0e17; // ท
const SARA_I = 0x0e34; // ิ
const SARA_II = 0x0e35; // ี
const SARA_UU = 0x0e39; // ู
const MAI_HAN_AKAT = 0x0e31; // ั
const MAI_EK = 0x0e48; // ่
const MAI_THO = 0x0e49; // ้
const MAI_TRI = 0x0e4a; // ๊
const THANTHAKHAT = 0x0e4c; // ์
const NIKHAHIT = 0x0e4d; // ํ
const SARA_AA = 0x0e32; // า
const SARA_AM = 0x0e33; // ำ

describe('normalizeThai', () => {
  it('giữ nguyên chuỗi đã chuẩn', () => {
    expect(normalizeThai('สวัสดี')).toBe('สวัสดี');
    expect(normalizeThai('น้ำ')).toBe('น้ำ');
  });

  it('dấu thanh gõ trước nguyên âm trên → đặt sau (ที่)', () => {
    expect(normalizeThai(s(THO, MAI_EK, SARA_II))).toBe(s(THO, SARA_II, MAI_EK));
  });

  it('dấu thanh trước nguyên âm dưới → đặt sau (ปู่)', () => {
    expect(normalizeThai(s(PO, MAI_EK, SARA_UU))).toBe(s(PO, SARA_UU, MAI_EK));
  });

  it('dấu thanh trước mai han-akat (กั๊)', () => {
    expect(normalizeThai(s(KO, MAI_TRI, MAI_HAN_AKAT))).toBe(s(KO, MAI_HAN_AKAT, MAI_TRI));
  });

  it('thanthakhat đứng sau nguyên âm', () => {
    expect(normalizeThai(s(KO, THANTHAKHAT, SARA_I))).toBe(s(KO, SARA_I, THANTHAKHAT));
  });

  it('ํ + า → ำ', () => {
    expect(normalizeThai(s(NO, NIKHAHIT, SARA_AA))).toBe(s(NO, SARA_AM));
  });

  it.each([
    ['ํ ้ า', [NO, NIKHAHIT, MAI_THO, SARA_AA]],
    ['้ ํ า', [NO, MAI_THO, NIKHAHIT, SARA_AA]],
    ['ำ ้ (dấu sau ำ)', [NO, SARA_AM, MAI_THO]],
  ])('น้ำ gõ kiểu %s → chuẩn', (_label, codes) => {
    expect(normalizeThai(s(...codes))).toBe(s(NO, MAI_THO, SARA_AM));
  });

  it('bỏ ký tự vô hình (ZWSP, ZWJ, ZWNJ, word joiner, BOM)', () => {
    const zw = s(0x200b),
      zwnj = s(0x200c),
      zwj = s(0x200d),
      wj = s(0x2060),
      bom = s(0xfeff);
    expect(normalizeThai(`${bom}สวัส${zw}ดี${zwnj}${zwj}${wj}`)).toBe('สวัสดี');
  });

  it('NFC cho chữ Latin/Việt đi kèm', () => {
    expect(normalizeThai('a' + s(0x0301))).toBe(s(0x00e1)); // a + dấu sắc rời → á
  });

  it('không đụng ký tự ngoài cụm dấu', () => {
    expect(normalizeThai('ก ข|ค')).toBe('ก ข|ค');
    expect(normalizeThai('')).toBe('');
  });

  it('idempotent', () => {
    for (const input of [
      s(THO, MAI_EK, SARA_II),
      s(NO, MAI_THO, NIKHAHIT, SARA_AA),
      s(NO, SARA_AM, MAI_THO),
      'สวัสดีครับ',
    ]) {
      const once = normalizeThai(input);
      expect(normalizeThai(once)).toBe(once);
    }
  });
});
