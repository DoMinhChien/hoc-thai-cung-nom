import { renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountData } from '@/data';
import { t } from '@/i18n';
import { useBreakpoint, useTouchControls } from '@/lib/useBreakpoint';
import { renderApp } from '@/test/render-app';

/** Giả lập màn hình rộng `width` px; `coarse` = thiết bị cảm ứng. */
function stubScreen(width: number, coarse = false) {
  vi.stubGlobal('matchMedia', (q: string) => {
    const min = /min-width:\s*(\d+)px/.exec(q);
    const matches = min ? width >= Number(min[1]) : q.includes('pointer: coarse') && coarse;
    return {
      matches,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });
}

beforeEach(async () => {
  await accountData.setGuestChosen();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('useBreakpoint (SCR-00 v2 §1)', () => {
  it.each([
    [375, 'phone'],
    [743, 'phone'],
    [744, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
  ])('%ipx → %s', (width, expected) => {
    stubScreen(width);
    expect(renderHook(() => useBreakpoint()).result.current).toBe(expected);
  });

  it('không có matchMedia (jsdom) → desktop', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useBreakpoint()).result.current).toBe('desktop');
  });

  it('điều khiển chạm: màn hẹp hoặc cảm ứng (iPad ngang)', () => {
    stubScreen(1280);
    expect(renderHook(() => useTouchControls()).result.current).toBe(false);
    stubScreen(1194, true);
    expect(renderHook(() => useTouchControls()).result.current).toBe(true);
    stubScreen(393);
    expect(renderHook(() => useTouchControls()).result.current).toBe(true);
  });
});

describe('khung phone (SCR-00 v2 §2)', () => {
  beforeEach(() => stubScreen(393, true));

  it('thanh tab dưới 4 tab + Thêm; sheet "Thêm" có Sổ từ, Tiến độ, Cài đặt, tài khoản', async () => {
    const { router } = renderApp('/');
    await screen.findByTestId('page-dashboard');
    const tabs = screen.getByTestId('tab-bar');
    expect(
      [...tabs.querySelectorAll('[data-testid^="nav-"]')].map((el) =>
        el.getAttribute('data-testid'),
      ),
    ).toEqual(['nav-dashboard', 'nav-units', 'nav-practice', 'nav-games', 'nav-more']);
    expect(screen.queryByTestId('nav-words')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('nav-more'));
    const sheet = await screen.findByTestId('more-sheet');
    expect(within(sheet).getByTestId('account-block-guest')).toBeInTheDocument();
    await userEvent.click(within(sheet).getByTestId('nav-words'));
    expect(router.state.location.pathname).toBe('/words');
    expect(screen.queryByTestId('more-sheet')).not.toBeInTheDocument();
    // Đang ở trang trong "Thêm" → tab Thêm sáng.
    expect(screen.getByTestId('nav-more')).toHaveAttribute('aria-current', 'page');
  });

  it('màn học / chơi ẩn thanh tab', async () => {
    renderApp('/games/true-false');
    await screen.findByTestId('page-game');
    expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument();
  });
});

describe('khung tablet (SCR-00 v2 §3)', () => {
  it('rail đủ 7 mục, không có sidebar / thanh tab', async () => {
    stubScreen(820, true);
    renderApp('/');
    await screen.findByTestId('page-dashboard');
    const rail = screen.getByRole('navigation', { name: t('nav.label') });
    expect(rail).toHaveAttribute('data-testid', 'nav-rail');
    expect(rail.querySelectorAll('[data-testid^="nav-"]')).toHaveLength(7);
    expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-account')).toHaveAttribute('href', '/account');
  });
});
