import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** `prefers-reduced-motion: reduce` (F-13) — theo dõi khi người dùng đổi cài đặt hệ điều hành. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia?.(REDUCED_MOTION);
      query?.addEventListener('change', onChange);
      return () => query?.removeEventListener('change', onChange);
    },
    () => window.matchMedia?.(REDUCED_MOTION).matches ?? false,
    () => false,
  );
}

function isTextField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Phím tắt toàn trang (số `1`–`9`, mũi tên, `Esc`…), so theo `KeyboardEvent.key` (chữ không phân
 * biệt hoa thường). Bỏ qua khi đang gõ trong ô nhập, khi có Ctrl/Meta/Alt, và Enter/Space trên nút
 * đang focus (để nút tự kích hoạt, không chạy hai lần).
 */
export function useKeyShortcut(
  keys: string | readonly string[],
  handler: (event: KeyboardEvent) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  const list = (typeof keys === 'string' ? [keys] : keys).map((k) => k.toLowerCase()).join('\n');

  useEffect(() => {
    if (!enabled) return;
    const wanted = list.split('\n');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (isTextField(e.target)) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLButtonElement) return;
      if (!wanted.includes(e.key.toLowerCase())) return;
      e.preventDefault();
      handlerRef.current(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [list, enabled]);
}

export interface CountdownOptions {
  /** Thời lượng (ms); `null` = chỉ đếm lên. */
  durationMs: number | null;
  /** `false` = dừng hẳn (chưa bắt đầu / đã kết thúc). */
  running?: boolean;
  /** Tự tạm dừng khi tab ẩn hoặc cửa sổ mất focus (SCR-08). */
  autoPause?: boolean;
  intervalMs?: number;
  /** Đồng hồ đơn điệu (ms) — test truyền đồng hồ giả. */
  clock?: () => number;
  /** Gọi mỗi `intervalMs` với thời gian đã chạy — trò chơi `tick` hết giờ ở đây. */
  onTick?: (elapsedMs: number) => void;
}

export interface Countdown {
  /** Thời gian đã chạy (không tính lúc tạm dừng), cập nhật mỗi `intervalMs`. */
  elapsedMs: number;
  /** `null` khi đếm lên. */
  remainingMs: number | null;
  paused: boolean;
  pause(): void;
  resume(): void;
  /** Thời gian đã chạy chính xác lúc gọi — dùng làm `now` của trò chơi trong handler. */
  now(): number;
}

const defaultClock = () => performance.now();

/**
 * Đồng hồ trò chơi: đếm thời gian chạy, tạm dừng khi tab ẩn (người học bấm tiếp tục).
 * Trò chơi trong `@nom/core` nhận `now()` này, nên thời gian tạm dừng không bị tính.
 */
export function useCountdown({
  durationMs,
  running = true,
  autoPause = true,
  intervalMs = 100,
  clock = defaultClock,
  onTick,
}: CountdownOptions): Countdown {
  const base = useRef(0);
  const since = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsed] = useState(0);
  const clockRef = useRef(clock);
  const onTickRef = useRef(onTick);
  useEffect(() => {
    clockRef.current = clock;
    onTickRef.current = onTick;
  });

  const now = useCallback(
    () => base.current + (since.current === null ? 0 : clockRef.current() - since.current),
    [],
  );
  const active = running && !paused;

  useEffect(() => {
    if (!active) return;
    since.current = clockRef.current();
    const id = window.setInterval(() => {
      const elapsed = now();
      setElapsed(elapsed);
      onTickRef.current?.(elapsed);
    }, intervalMs);
    return () => {
      window.clearInterval(id);
      base.current = now();
      since.current = null;
      setElapsed(base.current);
    };
  }, [active, intervalMs, now]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  useEffect(() => {
    if (!autoPause || !running) return;
    const onHidden = () => {
      if (document.visibilityState === 'hidden') pause();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('blur', pause);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('blur', pause);
    };
  }, [autoPause, running, pause]);

  return {
    elapsedMs,
    remainingMs: durationMs === null ? null : Math.max(0, durationMs - elapsedMs),
    paused,
    pause,
    resume,
    now,
  };
}
