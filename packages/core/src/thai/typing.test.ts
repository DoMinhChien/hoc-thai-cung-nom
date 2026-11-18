import { describe, expect, it } from 'vitest';
import { acceptedAnswers, diffThai, gradeThaiTyping } from './typing';

// Dựng chuỗi bằng code point để thấy rõ thứ tự gõ (mắt thường nhìn giống nhau).
const s = (...codes: number[]) => String.fromCodePoint(...codes);
const PHO = 0x0e1e; // พ
const KHO = 0x0e04; // ค
const MAI_EK = 0x0e48; // ่
const MAI_THO = 0x0e49; // ้
const SARA_II = 0x0e35; // ี
const NIKHAHIT = 0x0e4d; // ํ
const SARA_AA = 0x0e32; // า

const BROTHER = 'ผมมีพี่ชายหนึ่งคน';

describe('gradeThaiTyping (G-06, E-07)', () => {
  it('đúng nguyên văn', () => {
    expect(gradeThaiTyping(BROTHER, [BROTHER])).toEqual({
      verdict: 'correct',
      answer: BROTHER,
      diff: [],
    });
  });

  it('gõ dấu thanh trước nguyên âm trên (พ ่ ี) vẫn đúng — luồng E2E 4', () => {
    const typed = `ผมมี${s(PHO, MAI_EK, SARA_II)}ชายหนึ่งคน`;
    expect(typed).not.toBe(BROTHER);
    expect(gradeThaiTyping(typed, [BROTHER]).verdict).toBe('correct');
  });

  it('ํ + า thay cho ำ vẫn đúng', () => {
    expect(gradeThaiTyping(s(KHO, NIKHAHIT, SARA_AA), ['คำ']).verdict).toBe('correct');
  });

  it('khoảng trắng, dấu câu, ký tự vô hình không tính', () => {
    expect(gradeThaiTyping(' คุณ ชื่อ​อะไร ', ['คุณชื่ออะไร?']).verdict).toBe('correct');
    expect(gradeThaiTyping('คุณชื่ออะไร?', ['คุณ ชื่อ อะไร']).verdict).toBe('correct');
  });

  it.each([
    ['thêm ครับ', 'คุณชื่ออะไรครับ', 'คุณชื่ออะไร'],
    ['bỏ คะ', 'คุณชื่ออะไร', 'คุณชื่ออะไรคะ'],
    ['ค่ะ thay ครับ', 'สวัสดีค่ะ', 'สวัสดีครับ'],
    ['particle tách cụm', 'สวัสดี ครับ', 'สวัสดีครับ'],
    ['particle giữa câu, gõ liền', 'สวัสดีครับยินดีที่ได้รู้จัก', 'สวัสดี ยินดีที่ได้รู้จักครับ'],
  ])('ครับ/ค่ะ/คะ tùy chọn: %s', (_, input, answer) => {
    expect(gradeThaiTyping(input, [answer]).verdict).toBe('correct');
  });

  it('chọn đáp án khớp trong th_alt', () => {
    const result = gradeThaiTyping('ผมชื่อสมชาย', ['ฉันชื่อสมชาย', 'ผมชื่อสมชาย']);
    expect(result).toMatchObject({ verdict: 'correct', answer: 'ผมชื่อสมชาย' });
  });

  it('chỉ sai dấu thanh → tone, diff chỉ ra cụm sai', () => {
    const typed = `ผมมี${s(PHO, SARA_II, MAI_THO)}ชายหนึ่งคน`;
    const result = gradeThaiTyping(typed, [BROTHER]);
    expect(result.verdict).toBe('tone');
    expect(result.diff).toEqual([
      { kind: 'same', text: 'ผมมี' },
      { kind: 'extra', text: s(PHO, SARA_II, MAI_THO) },
      { kind: 'missing', text: s(PHO, SARA_II, MAI_EK) },
      { kind: 'same', text: 'ชายหนึ่งคน' },
    ]);
  });

  it('thiếu dấu thanh cũng là tone', () => {
    expect(gradeThaiTyping('ผมมีพีชายหนึงคน', [BROTHER]).verdict).toBe('tone');
  });

  it('sai chữ → wrong, diff với đáp án gần nhất, bỏ particle', () => {
    const result = gradeThaiTyping('ผมมีน้องชายครับ', ['ฉันมีพี่ชาย', 'ผมมีพี่ชาย']);
    expect(result).toEqual({
      verdict: 'wrong',
      answer: 'ผมมีพี่ชาย',
      diff: [
        { kind: 'same', text: 'ผมมี' },
        { kind: 'extra', text: 'น้อง' },
        { kind: 'missing', text: 'พี่' },
        { kind: 'same', text: 'ชาย' },
      ],
    });
  });

  it('bỏ trống → wrong, diff toàn phần thiếu', () => {
    expect(gradeThaiTyping('  ', ['ดี'])).toEqual({
      verdict: 'wrong',
      answer: 'ดี',
      diff: [{ kind: 'missing', text: 'ดี' }],
    });
  });

  it('đáp án chỉ có particle không khớp gì; danh sách rỗng → lỗi', () => {
    expect(gradeThaiTyping('ครับ', ['ครับ']).verdict).toBe('wrong');
    expect(() => gradeThaiTyping('ดี', ['', ' '])).toThrow(/ít nhất một đáp án/);
  });
});

describe('diffThai', () => {
  it('giữ cụm ký tự (dấu không đứng lẻ)', () => {
    expect(diffThai('ที่', 'ที')).toEqual([
      { kind: 'extra', text: 'ที่' },
      { kind: 'missing', text: 'ที' },
    ]);
  });

  it('thừa ở cuối / thiếu ở cuối', () => {
    expect(diffThai('ดีมาก', 'ดี')).toEqual([
      { kind: 'same', text: 'ดี' },
      { kind: 'extra', text: 'มาก' },
    ]);
    expect(diffThai('ดี', 'ดีมาก')).toEqual([
      { kind: 'same', text: 'ดี' },
      { kind: 'missing', text: 'มาก' },
    ]);
  });
});

describe('acceptedAnswers', () => {
  it('th + th_alt, bỏ ô trống', () => {
    expect(acceptedAnswers({ th: 'ก', th_alt: ['ข', ''] })).toEqual(['ก', 'ข']);
    expect(acceptedAnswers({ th: undefined, th_alt: [] })).toEqual([]);
  });
});
