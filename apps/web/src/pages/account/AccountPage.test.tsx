import { AuthError, MockAuthService, mockUser } from '@nom/core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { GUEST_KEY } from '@/data';
import { NomDatabase } from '@/data/db';
import { t } from '@/i18n';
import { renderApp, setOnline } from '@/test/render-app';

afterEach(async () => {
  setOnline(true);
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

const signedIn = (patch = {}) => new MockAuthService({ user: mockUser({ uid: 'u1', ...patch }) });

async function seedCards(userKey: string, n: number) {
  const db = new NomDatabase(userKey);
  await db.cards.bulkPut(Array.from({ length: n }, (_, i) => ({ id: `c${i}` })));
  db.close();
}

describe('AccountPage (SCR-02 A)', () => {
  it('hồ sơ: tên, email, ngày tham gia từ user.metadata (L-10)', async () => {
    renderApp(
      '/account',
      signedIn({ displayName: 'An', email: 'an@example.com', createdAt: '2026-11-15T12:00:00Z' }),
    );
    expect(await screen.findByTestId('account-name-input')).toHaveValue('An');
    expect(screen.getByTestId('account-email')).toHaveTextContent('an@example.com');
    expect(screen.getByTestId('account-joined')).toHaveTextContent('15/11/2026');
  });

  it('không có email → "Không có"', async () => {
    renderApp('/account', signedIn({ email: null }));
    expect(await screen.findByTestId('account-email')).toHaveTextContent(t('accountPage.noEmail'));
  });

  it('đổi tên: Lưu chỉ bật khi tên đổi; validate 2–30; lưu → toast', async () => {
    const auth = signedIn({ displayName: 'An' });
    renderApp('/account', auth);
    const input = await screen.findByTestId('account-name-input');
    const save = screen.getByTestId('account-name-save');
    expect(save).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, 'B');
    await userEvent.click(save);
    expect(screen.getByRole('alert')).toHaveTextContent(t('displayNameDialog.tooShort'));

    await userEvent.type(input, 'ình{Enter}');
    expect(await screen.findByText(t('accountPage.saved'))).toBeInTheDocument();
    expect(auth.calls).toContain('updateDisplayName:Bình');
    expect(screen.getByTestId('account-display-name')).toHaveTextContent('Bình');
  });

  it('Phase 1: phương thức đăng nhập chỉ Google, không có nút liên kết', async () => {
    renderApp('/account', signedIn());
    const row = await screen.findByTestId('provider-row-google');
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('provider-row-facebook')).not.toBeInTheDocument();
  });

  it('đăng xuất từ trang tài khoản → xác nhận → /login (flows §5)', async () => {
    const auth = signedIn();
    const { router } = renderApp('/account', auth);
    await userEvent.click(await screen.findByTestId('account-sign-out'));
    await userEvent.click(await screen.findByTestId('sign-out-confirm'));
    await screen.findByTestId('page-login');
    expect(router.state.location.pathname).toBe('/login');
    expect(auth.currentUser).toBeNull();
  });

  it('xoá tài khoản: phải gõ XOÁ; xoá user + IndexedDB của user, giữ Guest (L-08)', async () => {
    await seedCards('u1', 2);
    await seedCards(GUEST_KEY, 1);
    const auth = signedIn();
    const { router } = renderApp('/account', auth);
    await userEvent.click(await screen.findByTestId('account-delete'));

    const confirm = screen.getByTestId('delete-confirm');
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByTestId('delete-confirm-input'), 'XOA');
    expect(confirm).toBeDisabled();
    await userEvent.clear(screen.getByTestId('delete-confirm-input'));
    await userEvent.type(screen.getByTestId('delete-confirm-input'), 'XOÁ');
    await userEvent.click(confirm);

    expect(await screen.findByText(t('deleteDialog.done'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(auth.calls).toContain('deleteAccount');
    expect(await Dexie.exists('hoc-thai-nom-u1')).toBe(false);
    expect(await Dexie.exists('hoc-thai-nom-guest')).toBe(true);
  });

  it('xoá thất bại → báo lỗi, không xoá IndexedDB', async () => {
    await seedCards('u1', 1);
    const auth = signedIn();
    auth.nextError = new AuthError('network');
    renderApp('/account', auth);
    await userEvent.click(await screen.findByTestId('account-delete'));
    await userEvent.type(screen.getByTestId('delete-confirm-input'), 'XOÁ');
    await userEvent.click(screen.getByTestId('delete-confirm'));
    const dialog = screen.getByTestId('delete-dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(t('accountPage.error'));
    expect(await Dexie.exists('hoc-thai-nom-u1')).toBe(true);
  });

  it('offline: lưu tên và xoá tài khoản bị vô hiệu, đăng xuất vẫn dùng được', async () => {
    setOnline(false);
    renderApp('/account', signedIn());
    expect(await screen.findByTestId('account-delete')).toBeDisabled();
    await userEvent.type(screen.getByTestId('account-name-input'), 'x');
    expect(screen.getByTestId('account-name-save')).toBeDisabled();
    expect(screen.getByTestId('account-sign-out')).toBeEnabled();
  });
});

describe('Khối tài khoản & khung (SCR-00, L-06, L-09)', () => {
  it('Guest: "Khách" + nút Đăng nhập', async () => {
    renderApp('/alphabet');
    const block = await screen.findByTestId('account-block-guest');
    expect(within(block).getByTestId('account-sign-in')).toHaveAttribute('href', '/login');
  });

  it('đã đăng nhập: tên hiển thị; menu → Tài khoản / Đăng xuất', async () => {
    const auth = signedIn({ displayName: 'An' });
    const { router } = renderApp('/alphabet', auth);
    expect(await screen.findByTestId('account-display-name')).toHaveTextContent('An');

    await userEvent.click(screen.getByTestId('account-menu-trigger'));
    await userEvent.click(await screen.findByTestId('menu-account'));
    expect(router.state.location.pathname).toBe('/account');

    await userEvent.click(screen.getByTestId('account-menu-trigger'));
    await userEvent.click(await screen.findByTestId('menu-sign-out'));
    await userEvent.click(await screen.findByTestId('sign-out-confirm'));
    await screen.findByTestId('page-login');
    expect(auth.currentUser).toBeNull();
  });

  it('offline: badge "Ngoại tuyến", nút Đăng nhập vô hiệu', async () => {
    renderApp('/alphabet');
    await screen.findByTestId('account-block-guest');
    expect(screen.queryByTestId('offline-badge')).not.toBeInTheDocument();
    setOnline(false);
    expect(await screen.findByTestId('offline-badge')).toBeInTheDocument();
    expect(screen.getByTestId('account-sign-in')).toBeDisabled();
  });
});
