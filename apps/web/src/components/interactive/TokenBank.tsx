import type { ComponentProps } from 'react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useKeyShortcut } from './hooks';

export interface TokenChipProps extends ComponentProps<'button'> {
  shortcut?: string;
}

/** Thẻ từ tiếng Thái (E-06, F-03'). */
export function TokenChip({ shortcut, className, children, ...props }: TokenChipProps) {
  return (
    <button
      type="button"
      lang="th"
      data-slot="token-chip"
      aria-keyshortcuts={shortcut}
      className={cn(
        'relative inline-flex min-h-12 items-center rounded-md border border-border-strong bg-background px-3 pt-1 text-th-sm shadow-xs outline-none hover:border-game hover:bg-game-subtle motion-safe:transition-[border-color,background-color,transform] motion-safe:duration-150 enabled:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      {shortcut && (
        <kbd
          aria-hidden
          lang="vi"
          className="absolute top-0.5 left-1 font-sans text-[10px] leading-none font-semibold text-game"
        >
          {shortcut}
        </kbd>
      )}
      {children}
    </button>
  );
}

export interface TokenBankProps {
  /** Thẻ đã xáo. */
  tokens: readonly string[];
  /** Vị trí thẻ đã chọn, theo thứ tự câu. */
  value: readonly number[];
  onChange: (value: number[]) => void;
  /** Enter khi đã chọn ít nhất một thẻ. */
  onSubmit?: () => void;
  disabled?: boolean;
}

const MAX_SHORTCUT = 9;

/**
 * Dòng câu trả lời + ngân hàng thẻ từ (E-06, F-03'). Bấm thẻ (hoặc phím `1`–`9` theo vị trí trong
 * ngân hàng) để thêm; bấm thẻ ở dòng trả lời để bỏ; `Backspace` bỏ thẻ cuối; `Enter` gửi.
 * Thẻ đã dùng để lại chỗ trống → vị trí và phím số của các thẻ khác không đổi.
 */
export function TokenBank({ tokens, value, onChange, onSubmit, disabled }: TokenBankProps) {
  const pick = (i: number) => {
    if (!disabled && i < tokens.length && !value.includes(i)) onChange([...value, i]);
  };
  const remove = (position: number) => {
    if (!disabled) onChange(value.filter((_, p) => p !== position));
  };

  useKeyShortcut(
    Array.from({ length: Math.min(tokens.length, MAX_SHORTCUT) }, (_, i) => String(i + 1)),
    (e) => pick(Number(e.key) - 1),
    !disabled,
  );
  useKeyShortcut('Backspace', () => remove(value.length - 1), !disabled && value.length > 0);
  useKeyShortcut('Enter', () => onSubmit?.(), !disabled && value.length > 0 && !!onSubmit);

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label={t('play.answer')}
        data-testid="token-answer"
        className="flex min-h-16 flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-game/40 bg-game-subtle/60 p-2"
      >
        {value.map((i, position) => (
          <TokenChip
            key={`${i}`}
            disabled={disabled}
            className="border-game bg-game-subtle motion-safe:animate-enter"
            aria-label={t('play.removeToken', { token: tokens[i]! })}
            onClick={() => remove(position)}
          >
            {tokens[i]}
          </TokenChip>
        ))}
      </div>
      <div
        role="group"
        aria-label={t('play.bank')}
        data-testid="token-bank"
        className="flex flex-wrap gap-2"
      >
        {tokens.map((token, i) =>
          value.includes(i) ? (
            <span
              key={i}
              aria-hidden
              data-slot="token-placeholder"
              className="inline-flex min-h-12 rounded-md border border-dashed border-border px-3 pt-1 text-th-sm text-transparent"
              lang="th"
            >
              {token}
            </span>
          ) : (
            <TokenChip
              key={i}
              disabled={disabled}
              shortcut={i < MAX_SHORTCUT ? String(i + 1) : undefined}
              onClick={() => pick(i)}
            >
              {token}
            </TokenChip>
          ),
        )}
      </div>
    </div>
  );
}
