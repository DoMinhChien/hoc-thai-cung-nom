import { Check, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useKeyShortcut } from './hooks';

export type ChoiceStatus = 'idle' | 'correct' | 'wrong';

export interface ChoiceButtonProps extends Omit<ComponentProps<'button'>, 'onSelect' | 'children'> {
  /** Phím tắt hiện trên nút, vd. `1` (hoặc `F` / `J`). */
  shortcut?: string;
  /** Phím khác cũng chọn nút này, vd. `ArrowLeft` cho "Sai". */
  extraKeys?: readonly string[];
  status?: ChoiceStatus;
  onSelect: () => void;
  children: ReactNode;
}

const STATUS = {
  idle: 'border-border-strong bg-background hover:bg-accent',
  correct: 'border-positive bg-positive-subtle',
  wrong: 'border-destructive bg-destructive-subtle',
} as const;

/**
 * Nút lựa chọn có phím tắt (trò chơi, bài tập M9). Trạng thái đúng/sai có icon, không chỉ màu.
 */
export function ChoiceButton({
  shortcut,
  extraKeys = [],
  status = 'idle',
  onSelect,
  disabled,
  className,
  children,
  ...props
}: ChoiceButtonProps) {
  useKeyShortcut([...(shortcut ? [shortcut] : []), ...extraKeys], onSelect, !disabled);
  const Icon = status === 'correct' ? Check : status === 'wrong' ? X : null;
  return (
    <button
      type="button"
      data-slot="choice-button"
      data-status={status}
      aria-keyshortcuts={[shortcut, ...extraKeys].filter(Boolean).join(' ') || undefined}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'relative flex min-h-16 items-center justify-center gap-3 rounded-lg border-2 px-4 py-2 text-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default motion-safe:transition-colors',
        STATUS[status],
        className,
      )}
      {...props}
    >
      {shortcut && (
        <kbd
          aria-hidden
          className="absolute top-1.5 left-2 font-sans text-xs text-muted-foreground"
        >
          {shortcut}
        </kbd>
      )}
      {Icon && <Icon className="size-5 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}
