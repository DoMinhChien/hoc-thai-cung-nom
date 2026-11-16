import { expect, test } from '@playwright/test';
import {
  chooseGuest,
  countCards,
  lookupEmulatorUser,
  seedCards,
  signInWithGoogle,
  uniqueEmail,
} from './helpers';

const GUEST_DB = 'hoc-thai-nom-guest';

// Popup Auth Emulator thỉnh thoảng không trả kết quả (xem signInWithGoogle) → cho chạy lại.
test.describe.configure({ retries: 2 });

/**
 * Luồng E2E 0 (plan 7.4) trên Firebase Auth Emulator:
 * Guest học 3 thẻ → đăng nhập Google → đặt tên → chuyển tiến độ → đăng xuất → Guest rỗng →
 * đăng nhập lại → dữ liệu quay lại → xoá tài khoản → user biến mất, IndexedDB của user bị xoá.
 */
test('luồng 0: Guest → đăng nhập → chuyển tiến độ → đăng xuất → đăng nhập lại → xoá tài khoản', async ({
  page,
}, testInfo) => {
  const email = uniqueEmail('e2e', testInfo.project.name);

  // 1. Guest "học" 3 thẻ (seed — màn học có từ M5).
  await chooseGuest(page);
  await seedCards(page, GUEST_DB, 3);
  await expect(page.getByTestId('account-block-guest')).toBeVisible();

  // 2. Đăng nhập Google (popup emulator), lần đầu → D1 tên hiển thị (L-03).
  await page.getByTestId('account-sign-in').click();
  await expect(page.getByTestId('sign-in-facebook')).toHaveCount(0);
  await signInWithGoogle(page, email, 'Tên Từ Google');
  const nameInput = page.getByTestId('display-name-input');
  await expect(nameInput).toHaveValue('Tên Từ Google');
  await nameInput.fill('Người Học E2E');
  await page.getByTestId('display-name-submit').click();

  // 3. D2 chuyển tiến độ (L-07) → dữ liệu còn nguyên trong DB của user, Guest rỗng.
  await page.getByTestId('transfer-confirm').click();
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
  await expect(page.getByTestId('account-display-name')).toHaveText('Người Học E2E');

  const user = await lookupEmulatorUser(email);
  expect(user).not.toBeNull();
  const userDb = `hoc-thai-nom-${user!.localId}`;
  expect(await countCards(page, userDb)).toBe(3);
  expect(await countCards(page, GUEST_DB)).toBe(0);

  // 4. Đăng xuất → /login → Guest rỗng (flows §5).
  await page.getByTestId('account-menu-trigger').click();
  await page.getByTestId('menu-sign-out').click();
  await page.getByTestId('sign-out-confirm').click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByTestId('continue-as-guest').click();
  await expect(page.getByTestId('account-block-guest')).toBeVisible();
  expect(await countCards(page, GUEST_DB)).toBe(0);

  // 5. Phiên giữ qua lần mở lại (L-05) và đăng nhập lại → không hỏi tên, dữ liệu user quay lại.
  await page.getByTestId('account-sign-in').click();
  await signInWithGoogle(page, email);
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
  await expect(page.getByTestId('display-name-dialog')).toHaveCount(0);
  await expect(page.getByTestId('account-display-name')).toHaveText('Người Học E2E');
  await page.reload();
  await expect(page.getByTestId('account-display-name')).toHaveText('Người Học E2E');
  expect(await countCards(page, userDb)).toBe(3);

  // 6. Xoá tài khoản (L-08) → user biến mất khỏi emulator, IndexedDB của user bị xoá.
  await page.getByTestId('account-menu-trigger').click();
  await page.getByTestId('menu-account').click();
  await expect(page.getByTestId('page-account')).toBeVisible();
  await page.getByTestId('account-delete').click();
  await page.getByTestId('delete-confirm-input').fill('XOÁ');
  await page.getByTestId('delete-confirm').click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId('page-login')).toBeVisible();

  expect(await lookupEmulatorUser(email)).toBeNull();
  expect(await countCards(page, userDb)).toBeNull();
});

test('Guest vào /account → /login?next=/account; đăng nhập xong quay lại /account', async ({
  page,
}, testInfo) => {
  const email = uniqueEmail('e2e-next', testInfo.project.name);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
  await signInWithGoogle(page, email, 'Khách Ghé');
  await page.getByTestId('display-name-submit').click();
  await expect(page.getByTestId('page-account')).toBeVisible();
  await expect(page.getByTestId('account-email')).toHaveText(email);
});

test('offline (L-09): badge Ngoại tuyến, nút đăng nhập vô hiệu, Guest vẫn học được', async ({
  page,
  context,
}) => {
  await chooseGuest(page);
  await context.setOffline(true);
  await expect(page.getByTestId('offline-badge')).toBeVisible();
  await expect(page.getByTestId('account-sign-in')).toBeDisabled();
  await page.getByTestId('nav-units').click();
  await expect(page.getByTestId('page-units')).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByTestId('offline-badge')).toHaveCount(0);
});
