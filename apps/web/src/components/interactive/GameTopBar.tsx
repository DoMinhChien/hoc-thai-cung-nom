import {
  Heart,
  MessageSquareOff,
  Music,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Speech,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatClock } from './format';
import { useKeyShortcut } from './hooks';

const numberFormat = new Intl.NumberFormat('vi-VN');

export interface GameTopBarProps {
  title: string;
  /** Thời gian còn lại (`down`) hoặc đã chơi (`up`), ms; không có = không hiện đồng hồ. */
  timeMs?: number;
  clock?: 'down' | 'up';
  score: number;
  /** Nhãn thay "Điểm" (vd. Ghép cặp: "Lượt lật") — khi có thì không hiện "+n". */
  scoreLabel?: string;
  /** Hệ số combo; chỉ hiện khi ≥ 2. */
  combo?: number;
  onExit: () => void;
  /** Có thì hiện nút bật/tắt âm phản hồi (F-13). */
  sound?: { enabled: boolean; onToggle: () => void };
  /** Có thì hiện nút bật/tắt tự đọc chữ Thái; `disabled` khi máy không có giọng Thái. */
  speech?: { enabled: boolean; disabled?: boolean; onToggle: () => void };
  /** Trò "3 tim" (v7.3): số tim còn lại / tối đa; `delta` = vừa mất (−1) / được (+1). */
  lives?: { count: number; max: number; delta?: -1 | 0 | 1 };
  /** Có thì hiện nút ⏸ tạm dừng (`P`, SCR-08 v2 §B.0). */
  onPause?: () => void;
  /** Có thì hiện nút 🎵 âm nền (`M`); `disabled` khi chưa phát được. */
  music?: { enabled: boolean; disabled?: boolean; onToggle: () => void };
  /** Dòng phụ cạnh tên trò (vd. "Từng bước", "Tốc độ ×1,3"). */
  status?: string;
}

/** Nút trên thanh: vùng chạm ≥ 44px dưới desktop (SCR-00 v2 §7). */
const TOUCH_BUTTON = 'max-lg:min-h-11 max-lg:min-w-11';

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
  scoreLabel,
  combo = 0,
  onExit,
  sound,
  speech,
  lives,
  onPause,
  music,
  status,
}: GameTopBarProps) {
  useKeyShortcut('Escape', onExit);
  useKeyShortcut('p', () => onPause?.(), !!onPause);
  useKeyShortcut('m', () => music?.onToggle(), !!music && !music.disabled);
  // Lưu điểm trước để hiện phần vừa cộng (cập nhật state khi prop đổi — mẫu React chính thức).
  const [prev, setPrev] = useState(score);
  const [gain, setGain] = useState(0);
  if (score !== prev) {
    setGain(score - prev);
    setPrev(score);
  }
  const urgent = clock === 'down' && timeMs !== undefined && timeMs > 0 && timeMs <= URGENT_MS;
  return (
    <header
      data-testid="game-top-bar"
      className="flex min-h-14 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-surface/90 px-2 py-1.5 shadow-sm lg:flex-nowrap lg:gap-4 lg:px-3 lg:py-2"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        aria-keyshortcuts="Escape"
        className={TOUCH_BUTTON}
      >
        <X aria-hidden />
        <span className="max-tablet:sr-only">{t('play.exit')}</span>
        <kbd aria-hidden className="hidden font-sans text-xs text-muted-foreground lg:inline">
          Esc
        </kbd>
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold lg:flex-none">{title}</h1>
      {status && (
        <span
          data-testid="game-status"
          className="hidden text-sm text-muted-foreground tablet:inline"
        >
          {status}
        </span>
      )}
      {/*
       * Phone / tablet (SCR-00 v2 §5): dòng 1 = Thoát · tên · ⏸; dòng 2 = điểm, tim, đồng hồ, âm.
       * Desktop (`lg:contents`): một hàng như SCR-08.
       */}
      <div className="contents lg:ml-auto lg:flex lg:items-center lg:gap-6 lg:tabular-nums">
        <div className="order-last flex w-full flex-wrap items-center gap-x-4 tabular-nums lg:contents">
          {combo >= 2 && (
            <span
              key={combo}
              data-testid="game-combo"
              className="inline-flex items-center gap-1 rounded-full bg-game px-3 py-0.5 text-sm font-semibold text-game-fg motion-safe:animate-pop"
            >
              <Zap className="size-3.5" aria-hidden />
              {t('play.combo', { n: combo })}
            </span>
          )}
          <span data-testid="game-score" className="relative">
            <span className="sr-only">{scoreLabel ?? t('play.score')}: </span>
            <span aria-hidden className="text-sm text-muted-foreground">
              {scoreLabel ?? t('play.score')}{' '}
            </span>
            <span
              key={score}
              className="inline-block text-lg font-semibold text-game motion-safe:animate-pop"
            >
              {numberFormat.format(score)}
            </span>
            {gain > 0 && !scoreLabel && (
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
          {lives && <Lives {...lives} />}
          {timeMs !== undefined && (
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
          )}
          <div className="ml-auto flex items-center lg:contents">
            {speech && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={TOUCH_BUTTON}
                aria-pressed={speech.enabled && !speech.disabled}
                disabled={speech.disabled}
                aria-label={speech.enabled ? t('play.speechOn') : t('play.speechOff')}
                title={
                  speech.disabled
                    ? t('play.noVoice')
                    : speech.enabled
                      ? t('play.speechOn')
                      : t('play.speechOff')
                }
                onClick={speech.onToggle}
              >
                {speech.enabled && !speech.disabled ? (
                  <Speech aria-hidden />
                ) : (
                  <MessageSquareOff aria-hidden />
                )}
              </Button>
            )}
            {music && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={TOUCH_BUTTON}
                data-testid="game-music"
                aria-pressed={music.enabled && !music.disabled}
                aria-keyshortcuts="M"
                disabled={music.disabled}
                aria-label={music.enabled ? t('play.musicOn') : t('play.musicOff')}
                title={music.disabled ? t('play.musicUnavailable') : t('play.musicHint')}
                onClick={music.onToggle}
              >
                {music.enabled && !music.disabled ? <Music aria-hidden /> : <Music2 aria-hidden />}
              </Button>
            )}
            {sound && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={TOUCH_BUTTON}
                aria-pressed={sound.enabled}
                aria-label={sound.enabled ? t('play.soundOn') : t('play.soundOff')}
                title={sound.enabled ? t('play.soundOn') : t('play.soundOff')}
                onClick={sound.onToggle}
              >
                {sound.enabled ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
              </Button>
            )}
          </div>
        </div>
        {onPause && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="game-pause"
            aria-keyshortcuts="P"
            onClick={onPause}
            className={TOUCH_BUTTON}
          >
            <Pause aria-hidden />
            <span className="sr-only">{t('play.pause')}</span>
            <kbd aria-hidden className="hidden font-sans text-xs text-muted-foreground lg:inline">
              P
            </kbd>
          </Button>
        )}
      </div>
    </header>
  );
}

/** Tim còn lại: tim đầy màu đỏ (nghĩa "mạng"), tim mất là viền. Mất → rung, được → nảy. */
function Lives({ count, max, delta = 0 }: { count: number; max: number; delta?: -1 | 0 | 1 }) {
  const shown = Math.max(max, count);
  return (
    <span
      role="img"
      data-testid="game-lives"
      data-lives={count}
      aria-label={t('play.lives', { n: count })}
      className={cn('flex items-center gap-0.5', delta === -1 && 'motion-safe:animate-shake')}
    >
      {Array.from({ length: shown }, (_, i) => (
        <Heart
          key={i}
          aria-hidden
          className={cn(
            'size-5',
            i < count ? 'fill-destructive text-destructive' : 'text-border-strong',
            delta === 1 && i === count - 1 && 'motion-safe:animate-pop',
          )}
        />
      ))}
    </span>
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
          percent <= 20 ? 'bg-caution motion-safe:animate-urgent' : 'bg-game',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * Lớp phủ khi tạm dừng (`P`, tab ẩn / mất focus — SCR-08 v2 §B.0): Tiếp tục (`Space`) · Chơi lại
 * (`R`) · Thoát (`Esc`, do thanh trên xử lý).
 */
export function PausedOverlay({
  onResume,
  onRestart,
  onExit,
}: {
  onResume: () => void;
  onRestart?: () => void;
  onExit?: () => void;
}) {
  useKeyShortcut(' ', onResume);
  useKeyShortcut('r', () => onRestart?.(), !!onRestart);
  const button =
    'flex items-center justify-center gap-3 rounded-xl border-2 px-5 py-3 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-paused-title"
      data-testid="game-paused"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60"
    >
      <div className="flex w-80 flex-col gap-3 rounded-xl bg-surface p-6 shadow-md">
        <h2 id="game-paused-title" className="flex items-center gap-2 text-xl font-bold">
          <Pause className="size-5" aria-hidden />
          {t('play.paused')}
        </h2>
        <button
          type="button"
          autoFocus
          onClick={onResume}
          aria-keyshortcuts="Space"
          data-testid="game-resume"
          className={cn(button, 'border-primary bg-primary text-primary-foreground')}
        >
          <Play className="size-5" aria-hidden />
          {t('play.resume')}
          <kbd className="ml-auto font-sans text-xs opacity-80">Space</kbd>
        </button>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            aria-keyshortcuts="R"
            data-testid="game-restart"
            className={cn(button, 'border-border-strong bg-surface')}
          >
            <RotateCcw className="size-5" aria-hidden />
            {t('play.restart')}
            <kbd className="ml-auto font-sans text-xs text-muted-foreground">R</kbd>
          </button>
        )}
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            aria-keyshortcuts="Escape"
            className={cn(button, 'border-border-strong bg-surface')}
          >
            <X className="size-5" aria-hidden />
            {t('play.exit')}
            <kbd className="ml-auto font-sans text-xs text-muted-foreground">Esc</kbd>
          </button>
        )}
      </div>
    </div>
  );
}
