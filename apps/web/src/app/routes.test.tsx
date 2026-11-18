import { MockAuthService, mockUser } from '@nom/core';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { accountData } from '@/data';
import { renderApp } from '@/test/render-app';
import { t } from '@/i18n';
import { ROUTE_SAMPLES } from './route-samples';
import { LEGACY_REDIRECTS } from './routes';

beforeEach(async () => {
  await accountData.setGuestChosen();
});

afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('routes', () => {
  it.each(ROUTE_SAMPLES)('$path hiển thị trang $testId (Guest)', async ({ path, testId }) => {
    renderApp(path);
    expect(await screen.findByTestId(`page-${testId}`)).toBeInTheDocument();
  });

  it('điều hướng qua sidebar', async () => {
    const { router } = renderApp('/');
    await screen.findByTestId('page-dashboard');
    await userEvent.click(screen.getByTestId('nav-units'));
    expect(router.state.location.pathname).toBe('/units');
    expect(screen.getByTestId('page-units')).toBeInTheDocument();
    expect(screen.getByTestId('nav-units')).toHaveAttribute('aria-current', 'page');
  });

  it('sidebar đúng thứ tự SCR-00 v7', async () => {
    renderApp('/');
    await screen.findByTestId('page-dashboard');
    const ids = screen
      .getByRole('navigation', { name: t('nav.label') })
      .querySelectorAll('[data-testid^="nav-"]');
    expect([...ids].map((el) => el.getAttribute('data-testid'))).toEqual([
      'nav-dashboard',
      'nav-units',
      'nav-practice',
      'nav-words',
      'nav-games',
      'nav-progress',
      'nav-settings',
    ]);
  });

  it.each(Object.entries(LEGACY_REDIRECTS))('URL cũ %s → %s', async (from, to) => {
    const { router } = renderApp(from.replace(/:\w+$/, 'demo'));
    expect(await screen.findByTestId(`page-${to.slice(1)}`)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(to);
  });

  it('route lạ → trang 404', () => {
    renderApp('/khong-co');
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });

  it('chữ Thái ở /dev/typography có lang="th"', () => {
    renderApp('/dev/typography');
    for (const el of screen.getAllByTestId('typography-th')) {
      expect(el).toHaveAttribute('lang', 'th');
    }
  });

  it('/dev/typing: gõ câu mẫu rồi kiểm tra → hiện kết quả', async () => {
    renderApp('/dev/typing');
    fireEvent.change(screen.getByTestId('thai-input'), { target: { value: 'ผมมีพี่ชายหนึ่งคน' } });
    fireEvent.click(screen.getByTestId('typing-check'));
    expect(await screen.findByTestId('typing-feedback')).toHaveAttribute('data-verdict', 'correct');
    fireEvent.change(screen.getByTestId('thai-input'), { target: { value: 'ผม' } });
    expect(screen.queryByTestId('typing-feedback')).toBeNull();
  });
});

describe('quy tắc truy cập (flows §1–§2)', () => {
  it('lần đầu mở app, chưa chọn Guest → / chuyển /login', async () => {
    await Dexie.delete('hoc-thai-nom-guest');
    const { router } = renderApp('/');
    expect(await screen.findByTestId('page-login')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('deep link vào màn học vẫn mở khi chưa chọn Guest', async () => {
    await Dexie.delete('hoc-thai-nom-guest');
    renderApp('/units');
    expect(await screen.findByTestId('page-units')).toBeInTheDocument();
  });

  it('Guest vào /account → /login?next=/account', async () => {
    const { router } = renderApp('/account');
    expect(await screen.findByTestId('page-login')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?next=%2Faccount');
  });

  it('đã đăng nhập vào /login → về next', async () => {
    const auth = new MockAuthService({ user: mockUser() });
    const { router } = renderApp('/login?next=/account', auth);
    expect(await screen.findByTestId('page-account')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/account');
  });

  it('next ngoài app bị bỏ qua', async () => {
    const auth = new MockAuthService({ user: mockUser() });
    const { router } = renderApp('/login?next=//evil.example', auth);
    await screen.findByTestId('page-dashboard');
    expect(router.state.location.pathname).toBe('/');
  });

  it('đang xác định phiên: không chớp sang Guest', () => {
    const auth = new MockAuthService();
    // Không gọi callback → mô phỏng Firebase chưa khôi phục xong phiên.
    auth.onUserChanged = () => () => {};
    renderApp('/units', auth);
    expect(screen.getByTestId('account-block-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('account-block-guest')).not.toBeInTheDocument();
  });
});
