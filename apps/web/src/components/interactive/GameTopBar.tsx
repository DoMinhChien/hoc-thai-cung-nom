import { Pause, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatClock } from './format';
import { useKeyShortcut } from './hooks';

const numberFormat = new Intl.NumberFormat('vi-VN');

export interface GameTopBarProps {
  title: string;
  /** Thời gian còn lại (`down`) hoặc đã chơi (`up`), ms. */
  timeMs: number;
  clock?: 'down' | 'up';
  score: number;
  /** Hệ số combo; chỉ hiện khi ≥ 2. */
  combo?: number;
  onExit: () => void;
  /** Có thì hiện nút bật/tắt âm phản hồi (F-13). */
  sound?: { enabled: boolean; onToggle: () => void };
}

/** Đồng hồ đếm ngược ≤ mốc này (ms) → màu cảnh báo + nhấp nháy nhẹ. */
const URGENT_MS = 10_000;

/**
 * Thanh trên của màn chơi (SCR-08 §B): Thoát (Esc) · tên trò · đồng hồ · điểm · combo.
 * Điểm tăng → "+n" bay lên; combo đổi → nảy nhẹ (chỉ khi không giảm chuyển động).
 */
export function GameTopBar({
  title,
  timeMs,
  clock = 'down',
  score,
  combo = 0,
  onExit,
  sound,
}: GameTopBarProps) {
  useKeyShortcut('Escape', onExit);
  // Lưu điểm trước để hiện phần vừa cộng (cập nhật state khi prop đổi — mẫu React chính thức).
  const [prev, setPrev] = useState(score);
  const [gain, setGain] = useState(0);
  if (score !== prev) {
    setGain(score - prev);
    setPrev(score);
  }
  const urgent = clock === 'down' && timeMs > 0 && timeMs <= URGENT_MS;
  return (
    <header
      data-testid="game-top-bar"
      className="flex items-center gap-4 rounded-xl bg-accent px-3 py-2"
    >
      <Button variant="ghost" size="sm" onClick={onExit} aria-keyshortcuts="Escape">
        <X aria-hidden />
        {t('play.exit')}
        <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
          Esc
        </kbd>
      </Button>
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-6 tabular-nums">
        {combo >= 2 && (
          <span
            key={combo}
            data-testid="game-combo"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-sm font-semibold text-primary-foreground motion-safe:animate-pop"
          >
            <Zap className="size-3.5" aria-hidden />
            {t('play.combo', { n: combo })}
          </span>
        )}
        <span data-testid="game-score" className="relative">
          <span className="sr-only">{t('play.score')}: </span>
          <span aria-hidden className="text-sm text-muted-foreground">
            {t('play.score')}{' '}
          </span>
          <span
            key={score}
            className="inline-block text-lg font-semibold text-primary motion-safe:animate-pop"
          >
            {numberFormat.format(score)}
          </span>
          {gain > 0 && (
            <span
              key={`gain-${score}`}
              aria-hidden
              data-testid="game-gain"
              className="pointer-events-none absolute -top-3 right-0 text-sm font-semibold text-positive opacity-0 motion-safe:animate-rise"
            >
              +{gain}
            </span>
          )}
        </span>
        <span
          role="timer"
          data-testid="game-clock"
          data-urgent={urgent}
          aria-label={clock === 'down' ? t('play.timeLeft') : t('play.timeElapsed')}
          className={cn(
            'min-w-14 rounded-md bg-background px-2 text-right text-lg font-semibold',
            urgent && 'text-caution motion-safe:animate-urgent',
          )}
        >
          {formatClock(timeMs, clock)}
        </span>
        {sound && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={sound.enabled}
            aria-label={sound.enabled ? t('play.soundOn') : t('play.soundOff')}
            title={sound.enabled ? t('play.soundOn') : t('play.soundOff')}
            onClick={sound.onToggle}
          >
            {sound.enabled ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>
        )}
      </div>
    </header>
  );
}

export interface TimeBarProps {
  totalMs: number;
  remainingMs: number;
  className?: string;
}

/**
 * Thanh thời gian co dần (thời gian mỗi câu — F-03', F-04'). Chuyển động chỉ khi người dùng không
 * bật giảm chuyển động (`motion-safe`); chữ đồng hồ nằm ở `GameTopBar`.
 */
export function TimeBar({ totalMs, remainingMs, className }: TimeBarProps) {
  const percent = totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={t('play.timeLeft')}
      aria-valuemin={0}
      aria-valuemax={Math.round(totalMs / 1000)}
      aria-valuenow={Math.ceil(remainingMs / 1000)}
      data-testid="time-bar"
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn(
          'h-full rounded-full motion-safe:transition-[width] motion-safe:duration-100 motion-safe:ease-linear',
          percent <= 20 ? 'bg-caution motion-safe:animate-urgent' : 'bg-primary',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Lớp phủ khi đồng hồ tạm dừng (tab ẩn / mất focus) — `Space` để tiếp tục. */
export function PausedOverlay({ onResume }: { onResume: () => void }) {
  useKeyShortcut(' ', onResume);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-paused-title"
      data-testid="game-paused"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90"
    >
      <button
        type="button"
        autoFocus
        onClick={onResume}
        aria-keyshortcuts="Space"
        className="flex items-center gap-3 rounded-lg border-2 border-border-strong bg-background px-6 py-4 text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pause className="size-6" aria-hidden />
        <span id="game-paused-title">{t('play.paused')}</span>
      </button>
    </div>
  );
}
