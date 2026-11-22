import { useSyncExternalStore } from 'react';

/** Breakpoint SCR-00 v2 §1 (khớp `--breakpoint-tablet` / `lg` trong index.css). */
export type Breakpoint = 'phone' | 'tablet' | 'desktop';

const TABLET = '(min-width: 744px)';
const DESKTOP = '(min-width: 1024px)';

function query(q: string): MediaQueryList | undefined {
  return typeof window === 'undefined' ? undefined : window.matchMedia?.(q);
}

function subscribe(onChange: () => void) {
  const lists = [query(TABLET), query(DESKTOP)].filter((l) => l !== undefined);
  for (const l of lists) l.addEventListener?.('change', onChange);
  return () => {
    for (const l of lists) l.removeEventListener?.('change', onChange);
  };
}

function snapshot(): Breakpoint {
  const desktop = query(DESKTOP);
  // Không có matchMedia (jsdom) → desktop như trước M12.7.
  if (!desktop || desktop.matches) return 'desktop';
  return query(TABLET)?.matches ? 'tablet' : 'phone';
}

/**
 * Khung điều hướng theo bề rộng màn hình: phone (thanh tab dưới) · tablet (rail) · desktop
 * (sidebar). Chỉ render một khung để `data-testid` không bị trùng.
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, snapshot, () => 'desktop');
}

const COARSE = '(pointer: coarse)';

function subscribeCoarse(onChange: () => void) {
  const list = query(COARSE);
  list?.addEventListener?.('change', onChange);
  return () => list?.removeEventListener?.('change', onChange);
}

/** Thiết bị nhập chính là cảm ứng (iPhone, iPad — kể cả iPad ngang ở bề rộng desktop). */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribeCoarse,
    () => query(COARSE)?.matches ?? false,
    () => false,
  );
}

/**
 * Hiện điều khiển chạm trong màn chơi (SCR-00 v2 §5): thiết bị cảm ứng hoặc màn hẹp hơn desktop.
 * Desktop chuột + bàn phím giữ nguyên SCR-08.
 */
export function useTouchControls(): boolean {
  const coarse = useCoarsePointer();
  return useBreakpoint() !== 'desktop' || coarse;
}
