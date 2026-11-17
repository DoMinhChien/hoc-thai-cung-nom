/**
 * Bàn phím Thái **Kedmanee** theo chuẩn TIS 820-2538 (G-06, plan 7.5).
 * Mỗi phím vật lý (`KeyboardEvent.code`, vị trí trên bàn phím US) cho một ký tự thường và một ký tự Shift.
 * Dùng cho bàn phím ảo (vẽ phím) và map phím vật lý khi máy chưa cài bàn phím Thái.
 */
export interface KedmaneeKey {
  code: string;
  normal: string;
  shift: string;
}

/** `[code, thường, Shift]` theo từng hàng, trái → phải. */
const ROWS: readonly (readonly [string, string, string])[][] = [
  [
    ['Backquote', '_', '%'],
    ['Digit1', 'ๅ', '+'],
    ['Digit2', '/', '๑'],
    ['Digit3', '-', '๒'],
    ['Digit4', 'ภ', '๓'],
    ['Digit5', 'ถ', '๔'],
    ['Digit6', 'ุ', 'ู'],
    ['Digit7', 'ึ', '฿'],
    ['Digit8', 'ค', '๕'],
    ['Digit9', 'ต', '๖'],
    ['Digit0', 'จ', '๗'],
    ['Minus', 'ข', '๘'],
    ['Equal', 'ช', '๙'],
  ],
  [
    ['KeyQ', 'ๆ', '๐'],
    ['KeyW', 'ไ', '"'],
    ['KeyE', 'ำ', 'ฎ'],
    ['KeyR', 'พ', 'ฑ'],
    ['KeyT', 'ะ', 'ธ'],
    ['KeyY', 'ั', 'ํ'],
    ['KeyU', 'ี', '๊'],
    ['KeyI', 'ร', 'ณ'],
    ['KeyO', 'น', 'ฯ'],
    ['KeyP', 'ย', 'ญ'],
    ['BracketLeft', 'บ', 'ฐ'],
    ['BracketRight', 'ล', ','],
    ['Backslash', 'ฃ', 'ฅ'],
  ],
  [
    ['KeyA', 'ฟ', 'ฤ'],
    ['KeyS', 'ห', 'ฆ'],
    ['KeyD', 'ก', 'ฏ'],
    ['KeyF', 'ด', 'โ'],
    ['KeyG', 'เ', 'ฌ'],
    ['KeyH', '้', '็'],
    ['KeyJ', '่', '๋'],
    ['KeyK', 'า', 'ษ'],
    ['KeyL', 'ส', 'ศ'],
    ['Semicolon', 'ว', 'ซ'],
    ['Quote', 'ง', '.'],
  ],
  [
    ['KeyZ', 'ผ', '('],
    ['KeyX', 'ป', ')'],
    ['KeyC', 'แ', 'ฉ'],
    ['KeyV', 'อ', 'ฮ'],
    ['KeyB', 'ิ', 'ฺ'],
    ['KeyN', 'ื', '์'],
    ['KeyM', 'ท', '?'],
    ['Comma', 'ม', 'ฒ'],
    ['Period', 'ใ', 'ฬ'],
    ['Slash', 'ฝ', 'ฦ'],
  ],
];

export const KEDMANEE_ROWS: readonly (readonly KedmaneeKey[])[] = ROWS.map((row) =>
  row.map(([code, normal, shift]) => ({ code, normal, shift })),
);

const BY_CODE = new Map(KEDMANEE_ROWS.flat().map((key) => [key.code, key]));

/** Ký tự Kedmanee của phím vật lý `code`; phím ngoài bảng (Space, Enter…) → `undefined`. */
export function kedmaneeChar(code: string, shift: boolean): string | undefined {
  const key = BY_CODE.get(code);
  return key && (shift ? key.shift : key.normal);
}
