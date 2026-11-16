import type { MasteryLevel } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { MASTERY_BG, MASTERY_FG } from './levels';
import { MasteryPips } from './MasteryPips';

export interface MasteryGridItem {
  id: string;
  /** Chữ Thái hiển thị trong ô. */
  thai: string;
  /** Tên đọc cho trình đọc màn hình, vd. `ก ไก่`. */
  name?: string;
  level: MasteryLevel;
}

/**
 * P-02: lưới chữ cái tô màu theo mức thuộc; mỗi ô có chấm mức (không chỉ màu).
 * Có `onSelect` → ô là nút (mở lịch sử ôn của chữ, M6).
 */
export function MasteryGrid({
  items,
  onSelect,
  className,
}: {
  items: readonly MasteryGridItem[];
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <ul
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2', className)}
      data-testid="mastery-grid"
    >
      {items.map((item) => {
        const label = t('progress.gridItem', {
          item: item.name ?? item.thai,
          level: t(`progress.level.${item.level}`),
        });
        const cell = cn(
          'relative flex aspect-square w-full flex-col items-center justify-center rounded-md border border-border',
          MASTERY_BG[item.level],
          MASTERY_FG[item.level],
        );
        const content = (
          <>
            <span lang="th" className="font-thai text-th-sm leading-none" aria-hidden="true">
              {item.thai}
            </span>
            <span className="absolute bottom-1.5">
              <MasteryPips level={item.level} />
            </span>
          </>
        );
        return (
          <li key={item.id} data-testid={`mastery-cell-${item.id}`} data-level={item.level}>
            {onSelect ? (
              <button
                type="button"
                aria-label={label}
                onClick={() => onSelect(item.id)}
                className={cn(
                  cell,
                  'cursor-pointer hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                )}
              >
                {content}
              </button>
            ) : (
              <div role="img" aria-label={label} className={cell}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
