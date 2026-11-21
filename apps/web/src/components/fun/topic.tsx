import { unitEmoji, type TopicColor, type UnitSummary } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

const SIZE = {
  sm: 'text-[32px]',
  md: 'text-[48px]',
  lg: 'text-[64px]',
  xl: 'text-[96px]',
} as const;

/** Emoji minh họa (Noto nếu máy có) — chỉ trang trí, luôn có chữ kèm bên cạnh. */
export function Emoji({
  children,
  size = 'md',
  className,
}: {
  children: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn('nom-emoji select-none', SIZE[size], className)}>
      {children}
    </span>
  );
}

/**
 * Ô minh họa chuyên đề (M0.5c §2.2): emoji giữa ô nền `topic.subtle`; Chuyên đề có nhãn "CĐ" ở góc
 * (phân nhánh không dựa vào màu).
 */
export function TopicTile({
  unit,
  color,
  size = 'md',
  className,
}: {
  unit: Pick<UnitSummary, 'kind' | 'emoji'>;
  color: TopicColor | undefined;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const box = { md: 'size-16', lg: 'size-24', xl: 'size-32' }[size];
  return (
    <span
      data-topic={color}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-xl bg-topic-subtle',
        box,
        className,
      )}
    >
      <Emoji size={size}>{unitEmoji(unit)}</Emoji>
      {unit.kind === 'grammar' && (
        <span className="absolute top-1 right-1 rounded bg-surface px-1 text-[10px] font-bold text-topic">
          {t('units.grammarTag')}
        </span>
      )}
    </span>
  );
}
