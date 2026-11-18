import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ROUTE_SAMPLES } from '../src/app/route-samples';
import { chooseGuest, signInWithGoogle, uniqueEmail } from './helpers';

const PATHS = [
  ...ROUTE_SAMPLES.map((r) => r.path),
  '/dev/typography',
  '/dev/progress',
  '/dev/typing',
];

async function expectNoSevereViolations(page: Page) {
  // Đợi hiệu ứng mở dialog chạy xong — chữ đang mờ dần làm axe báo sai độ tương phản.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    severe.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

for (const path of PATHS) {
  test(`axe: ${path} không có lỗi serious/critical`, async ({ page }) => {
    await chooseGuest(page);
    await page.goto(path);
    await page.locator('main').first().waitFor();
    await expectNoSevereViolations(page);
  });
}

test.describe('đã đăng nhập (Auth Emulator)', () => {
  // Popup emulator thỉnh thoảng không trả kết quả (xem signInWithGoogle) → cho chạy lại.
  test.describe.configure({ retries: 2 });

  test('axe: dialog tên hiển thị (D1)', async ({ page }, testInfo) => {
    await page.goto('/login');
    await signInWithGoogle(page, uniqueEmail('axe-d1', testInfo.project.name), 'Axe');
    await expect(page.getByTestId('display-name-dialog')).toBeVisible();
    await expectNoSevereViolations(page);
  });

  test('axe: /account khi đã đăng nhập', async ({ page }, testInfo) => {
    await page.goto('/login?next=/account');
    await signInWithGoogle(page, uniqueEmail('axe-account', testInfo.project.name), 'Axe');
    await page.getByTestId('display-name-submit').click();
    await expect(page.getByTestId('page-account')).toBeVisible();
    await expectNoSevereViolations(page);
  });
});
