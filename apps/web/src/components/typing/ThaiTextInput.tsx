import { kedmaneeChar } from '@nom/core';
import { KeyboardIcon } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { t } from '@/i18n';
import { useCoarsePointer } from '@/lib/useBreakpoint';
import { cn } from '@/lib/utils';
import { ThaiKeyboard } from './ThaiKeyboard';

/** Phím ra ký tự ASCII in được (không gồm khoảng trắng) — tức máy đang dùng bàn phím Latin. */
const LATIN_KEY = /^[!-~]$/;

export interface ThaiTextInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter trong ô nhập. */
  onSubmit?: () => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
  disabled?: boolean;
  /** Hiện bàn phím ảo lúc đầu (người học ẩn/hiện được); thiết bị cảm ứng luôn bắt đầu ẩn. */
  defaultKeyboardOpen?: boolean;
}

/**
 * Ô gõ chữ Thái (G-06): bàn phím ảo Kedmanee bên dưới, ẩn/hiện được. Máy chưa cài bàn phím Thái
 * (phím ra chữ Latin) → đổi theo vị trí Kedmanee; bàn phím Thái của hệ điều hành / IME giữ nguyên.
 * Thiết bị cảm ứng (SCR-00 v2 §6): mặc định dùng bàn phím hệ thống (iOS đã cài tiếng Thái); bật bàn
 * phím ảo thì nó nằm ở đáy màn hình và ô nhập dùng `inputmode="none"` để bàn phím hệ thống không mở
 * chồng lên.
 */
export function ThaiTextInput({
  value,
  onChange,
  onSubmit,
  disabled,
  defaultKeyboardOpen = true,
  ...aria
}: ThaiTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const coarse = useCoarsePointer();
  const [open, setOpen] = useState(defaultKeyboardOpen && !coarse);
  const docked = coarse && open && !disabled;
  const keyboardId = useId();

  // Đặt lại con trỏ sau khi giá trị mới đã render.
  useLayoutEffect(() => {
    if (caret.current === null) return;
    inputRef.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [value]);

  const selection = () => {
    const el = inputRef.current;
    return { start: el?.selectionStart ?? value.length, end: el?.selectionEnd ?? value.length };
  };

  const insert = (text: string) => {
    const { start, end } = selection();
    caret.current = start + text.length;
    onChange(value.slice(0, start) + text + value.slice(end));
  };

  const backspace = () => {
    const { start, end } = selection();
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    caret.current = from;
    onChange(value.slice(0, from) + value.slice(end));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
      return;
    }
    if (!LATIN_KEY.test(e.key)) return;
    const char = kedmaneeChar(e.code, e.shiftKey !== e.getModifierState('CapsLock'));
    if (!char) return;
    e.preventDefault();
    insert(char);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          lang="th"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode={docked ? 'none' : undefined}
          data-testid="thai-input"
          className="h-12 text-th-sm md:text-th-sm"
          {...aria}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-expanded={open}
          aria-controls={keyboardId}
          aria-label={open ? t('typing.hideKeyboard') : t('typing.showKeyboard')}
          title={open ? t('typing.hideKeyboard') : t('typing.showKeyboard')}
          data-testid="toggle-keyboard"
          onClick={() => setOpen((o) => !o)}
        >
          <KeyboardIcon aria-hidden />
        </Button>
      </div>
      {open && !disabled && (
        <ThaiKeyboard
          id={keyboardId}
          onKey={insert}
          onBackspace={backspace}
          className={cn(
            docked &&
              'fixed inset-x-0 bottom-0 z-40 border-t bg-surface px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-md',
          )}
        />
      )}
      {/* Chừa chỗ cho bàn phím dock để nội dung cuối trang không bị che. */}
      {docked && <div aria-hidden className="h-64" />}
    </div>
  );
}
