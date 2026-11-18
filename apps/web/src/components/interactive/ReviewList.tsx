import type { GameItemRef, GameMistake } from '@nom/core';
import { Bookmark, BookmarkX } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { itemKey, langOf } from './format';

export interface ReviewListProps {
  mistakes: readonly GameMistake[];
  /** Khóa `itemKey` của các mục đang "cần ôn". */
  flagged: ReadonlySet<string>;
  onToggle: (item: GameItemRef, flagged: boolean) => void;
}

/**
 * Danh sách mục sai ở màn kết quả (SCR-08 §C, v7.3 tham khảo Memrise): mặc định đã "cần ôn",
 * người học bấm để bỏ / thêm lại.
 */
export function ReviewList({ mistakes, flagged, onToggle }: ReviewListProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm text-muted-foreground">{t('play.reviewHint')}</p>
      <ul data-testid="review-list" className="flex flex-col gap-2">
        {mistakes.map((m) => {
          const on = flagged.has(itemKey(m));
          const Icon = on ? Bookmark : BookmarkX;
          return (
            <li
              key={itemKey(m)}
              className="flex items-center gap-4 rounded-lg bg-background px-4 py-2 shadow-xs motion-safe:animate-enter"
            >
              <span lang="th" className="text-th-sm">
                {m.th}
              </span>
              <span className="text-sm text-muted-foreground">
                → <span lang={langOf(m.expected)}>{m.expected}</span>
                {m.given && (
                  <>
                    {' · '}
                    <del lang={langOf(m.given)}>{m.given}</del>
                  </>
                )}
              </span>
              <button
                type="button"
                aria-pressed={on}
                aria-label={t('play.reviewToggle', { item: m.th })}
                onClick={() => onToggle(m, !on)}
                className={cn(
                  'ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-colors',
                  on
                    ? 'border-game bg-game text-game-fg'
                    : 'border-border-strong text-muted-foreground hover:bg-game-subtle',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t('play.needsReview')}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
