import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { useKeyShortcut, useReducedMotion } from './hooks';

const STEP_MS = 700;

/**
 * Màn đếm "3 · 2 · 1" trước khi chơi (SCR-08 §B). `Space` bắt đầu ngay; giảm chuyển động → bỏ qua.
 */
export function CountIn({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(3);
  useKeyShortcut(' ', onDone);

  useEffect(() => {
    if (reduced || n === 0) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => setN((x) => x - 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [n, reduced, onDone]);

  return (
    <div
      data-testid="count-in"
      className="flex flex-col items-center justify-center gap-4 rounded-xl bg-game-subtle py-16"
    >
      <span
        key={n}
        aria-live="assertive"
        className="text-7xl font-semibold text-game tabular-nums motion-safe:animate-pop"
      >
        {Math.max(n, 1)}
      </span>
      <p className="text-sm text-muted-foreground">{t('play.countIn')}</p>
    </div>
  );
}
