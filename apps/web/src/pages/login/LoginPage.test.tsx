import { AuthError, MockAuthService } from '@nom/core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { accountData, GUEST_KEY } from '@/data';
import { t } from '@/i18n';
import { countCards, seedCards } from '@/test/cards';
import { renderApp, setOnline } from '@/test/render-app';

afterEach(async () => {
  setOnline(true);
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('LoginPage (SCR-01)', () => {
  it('Phase 1: chỉ có nút Google + Guest, không có nút Facebook (L-01)', async () => {
    renderApp('/login');
    expect(await screen.findByTestId('sign-in-google')).toBeEnabled();
    expect(screen.queryByTestId('sign-in-facebook')).not.toBeInTheDocument();
    expect(screen.getByTestId('continue-as-guest')).toBeEnabled();
  });

  it('flag Facebook bật → có nút Facebook', async () => {
    renderApp('/login', new MockAuthService({ providers: ['google', 'facebook'] }));
    expect(await screen.findByTestId('sign-in-facebook')).toBeInTheDocument();
  });

  it('thẻ ví dụ v7: từ vựng có lang="th", nghĩa + bài, không có thanh điệu', async () => {
    renderApp('/login');
    const card = await screen.findByTestId('login-example-card');
    expect(within(card).getByText('ก๋วยเตี๋ยว')).toHaveAttribute('lang', 'th');
    expect(within(card).getByText(t('login.exampleMeaning'))).toBeInTheDocument();
    expect(within(card).getByText(t('login.exampleUnit'))).toBeInTheDocument();
    expect(card.querySelector('[data-tone], svg')).toBeNull();
  });

  it('"Học không cần đăng nhập" → ghi nhớ Guest, vào Dashboard (L-02)', async () => {
    const { router } = renderApp('/login');
    await userEvent.click(await screen.findByTestId('continue-as-guest'));
    await screen.findByTestId('page-dashboard');
    expect(router.state.location.pathname).toBe('/');
    expect(await accountData.isGuestChosen()).toBe(true);
  });

  it('huỷ popup → toast thông tin, ở lại /login', async () => {
    const auth = new MockAuthService();
    auth.nextSignIn = new AuthError('cancelled', 'auth/popup-closed-by-user');
    const { router } = renderApp('/login', auth);
    await userEvent.click(await screen.findByTestId('sign-in-google'));
    expect(await screen.findByText(t('login.cancelled'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByTestId('sign-in-google')).toBeEnabled();
  });

  it('popup bị chặn → thông báo cảnh báo trong card', async () => {
    const auth = new MockAuthService();
    auth.nextSignIn = new AuthError('popup-blocked', 'auth/popup-blocked');
    renderApp('/login', auth);
    await userEvent.click(await screen.findByTestId('sign-in-google'));
    expect(await screen.findByTestId('login-popup-blocked')).toBeInTheDocument();
  });

  it('lỗi mạng → thông báo lỗi kèm mã lỗi', async () => {
    const auth = new MockAuthService();
    auth.nextSignIn = new AuthError('network', 'auth/network-request-failed');
    renderApp('/login', auth);
    await userEvent.click(await screen.findByTestId('sign-in-google'));
    const notice = await screen.findByTestId('login-error');
    expect(notice).toHaveTextContent('auth/network-request-failed');
  });

  it('offline: nút Google vô hiệu, Guest vẫn dùng được (L-09)', async () => {
    setOnline(false);
    renderApp('/login');
    expect(await screen.findByTestId('sign-in-google')).toBeDisabled();
    expect(screen.getByTestId('login-offline')).toBeInTheDocument();
    expect(screen.getByTestId('continue-as-guest')).toBeEnabled();
  });

  it('lần đầu đăng nhập, không có tiến độ Guest: D1 tên hiển thị → Dashboard (L-03)', async () => {
    const auth = new MockAuthService();
    auth.nextSignIn = { isNewUser: true, user: { displayName: 'Minh Chiến' } };
    const { router } = renderApp('/login?next=/units', auth);
    await userEvent.click(await screen.findByTestId('sign-in-google'));

    const dialog = await screen.findByTestId('display-name-dialog');
    const input = within(dialog).getByTestId('display-name-input');
    expect(input).toHaveValue('Minh Chiến');

    // Bắt buộc: Esc không đóng.
    await userEvent.keyboard('{Escape}');
    expect(screen.getByTestId('display-name-dialog')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.click(within(dialog).getByTestId('display-name-submit'));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(t('displayNameDialog.tooShort'));

    await userEvent.type(input, '  Lan  ');
    await userEvent.click(within(dialog).getByTestId('display-name-submit'));

    await screen.findByTestId('page-units');
    expect(router.state.location.pathname).toBe('/units');
    expect(auth.calls).toContain('updateDisplayName:Lan');
    expect(screen.queryByTestId('transfer-dialog')).not.toBeInTheDocument();
  });

  it('lần đầu đăng nhập, có tiến độ Guest: D1 → D2 → chuyển tiến độ (L-07)', async () => {
    await accountData.setGuestChosen();
    await seedCards(GUEST_KEY, 3);
    const auth = new MockAuthService();
    auth.nextSignIn = { isNewUser: true, user: { uid: 'u-new' } };
    renderApp('/login', auth);
    await userEvent.click(await screen.findByTestId('sign-in-google'));
    await userEvent.click(await screen.findByTestId('display-name-submit'));

    await userEvent.click(await screen.findByTestId('transfer-confirm'));

    await screen.findByTestId('page-dashboard');
    expect(await screen.findByText(t('transferDialog.done'))).toBeInTheDocument();
    expect(await countCards('u-new')).toBe(3);
    expect(await countCards(GUEST_KEY)).toBe(0);
  });

  it('không phải lần đầu, có tiến độ Guest: chỉ D2; "Bắt đầu mới" giữ nguyên Guest', async () => {
    await seedCards(GUEST_KEY, 2);
    const auth = new MockAuthService();
    auth.nextSignIn = { isNewUser: false, user: { uid: 'u-old' } };
    renderApp('/login', auth);
    await userEvent.click(await screen.findByTestId('sign-in-google'));

    expect(await screen.findByTestId('transfer-dialog')).toBeInTheDocument();
    expect(screen.queryByTestId('display-name-dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('transfer-skip'));

    await screen.findByTestId('page-dashboard');
    expect(await countCards(GUEST_KEY)).toBe(2);
    // Không chuyển tiến độ: DB của tài khoản không có thẻ (layout có thể đã mở DB rỗng — badge Bài tập).
    expect(await countCards('u-old')).toBe(0);
  });
});
