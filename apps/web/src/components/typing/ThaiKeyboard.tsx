import { KEDMANEE_ROWS } from '@nom/core';
import { useEffect, useRef } from 'react';
import Keyboard from 'simple-keyboard';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

const BKSP = '{bksp}';
const SHIFT = '{shift}';
const LOCK = '{lock}';
const SPACE = '{space}';

type LayoutName = 'default' | 'shift';

/** Layout `simple-keyboard` (hàng phím ngăn bằng khoảng trắng) dựng từ bảng Kedmanee của core. */
function layoutRows(pick: 'normal' | 'shift'): string[] {
  const [digits, top, home, bottom] = KEDMANEE_ROWS.map((row) => row.map((key) => key[pick]));
  return [
    [...digits!, BKSP].join(' '),
    top!.join(' '),
    [LOCK, ...home!].join(' '),
    [SHIFT, ...bottom!, SHIFT].join(' '),
    SPACE,
  ];
}

const LAYOUT = { default: layoutRows('normal'), shift: layoutRows('shift') };
const CHARS = KEDMANEE_ROWS.flat().flatMap((key) => [key.normal, key.shift]);

/** Dấu kết hợp (nguyên âm trên/dưới, dấu thanh) hiện trên vòng chấm ◌ để nhìn rõ. */
const DISPLAY: Record<string, string> = Object.fromEntries(
  CHARS.filter((c) => /\p{M}/u.test(c)).map((c) => [c, `◌${c}`]),
);

export interface ThaiKeyboardProps {
  /** Một ký tự Thái (hoặc khoảng trắng) được bấm. */
  onKey: (char: string) => void;
  onBackspace: () => void;
  id?: string;
  className?: string;
}

/**
 * Bàn phím ảo Kedmanee (G-06) trên `simple-keyboard` (plan 7.5). Phím là `<button>`, bấm chuột
 * không lấy focus khỏi ô nhập. Shift áp dụng cho một phím; Caps Lock giữ tới khi tắt.
 */
export function ThaiKeyboard({ onKey, onBackspace, id, className }: ThaiKeyboardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onKey, onBackspace });
  useEffect(() => {
    handlers.current = { onKey, onBackspace };
  });

  useEffect(() => {
    let shift = false;
    let lock = false;
    const pressed = (on: boolean, button: string) =>
      on ? [{ attribute: 'aria-pressed', value: 'true', buttons: button }] : [];
    const options = () => ({
      layoutName: (shift !== lock ? 'shift' : 'default') satisfies LayoutName,
      buttonAttributes: [
        { attribute: 'lang', value: 'th', buttons: CHARS.join(' ') },
        { attribute: 'aria-label', value: t('typing.backspace'), buttons: BKSP },
        { attribute: 'aria-label', value: t('typing.shift'), buttons: SHIFT },
        { attribute: 'aria-label', value: t('typing.capsLock'), buttons: LOCK },
        { attribute: 'aria-label', value: t('typing.space'), buttons: SPACE },
        ...pressed(shift, SHIFT),
        ...pressed(lock, LOCK),
      ],
    });
    const keyboard = new Keyboard(ref.current!, {
      layout: LAYOUT,
      display: { ...DISPLAY, [BKSP]: '⌫', [SHIFT]: '⇧', [LOCK]: '⇪', [SPACE]: ' ' },
      theme: 'hg-theme-nom',
      useButtonTag: true,
      // `onclick` (không phải pointerdown): Enter/Space trên phím đang focus và trình đọc màn hình bấm được.
      useMouseEvents: true,
      preventMouseDownDefault: true,
      disableButtonHold: true,
      onKeyPress: (button: string) => {
        if (button === SHIFT) shift = !shift;
        else if (button === LOCK) lock = !lock;
        else {
          if (button === BKSP) handlers.current.onBackspace();
          else handlers.current.onKey(button === SPACE ? ' ' : button);
          if (!shift) return;
          shift = false;
        }
        keyboard.setOptions(options());
      },
      ...options(),
    });
    return () => keyboard.destroy();
  }, []);

  return (
    <div
      id={id}
      role="group"
      aria-label={t('typing.keyboard')}
      data-testid="thai-keyboard"
      className={cn('w-full', className)}
    >
      {/* simple-keyboard lấy class đầu tiên làm tên instance (bắt buộc có). */}
      <div ref={ref} className="simple-keyboard" />
    </div>
  );
}
