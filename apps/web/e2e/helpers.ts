import { expect, type Page } from '@playwright/test';

export const EMULATOR = 'http://127.0.0.1:9099';
export const PROJECT_ID = 'demo-hoc-thai-nom';

/** Email duy nhất cho mỗi lần chạy — các project Playwright chạy song song trên cùng emulator. */
export function uniqueEmail(prefix: string, projectName: string) {
  return `${prefix}-${projectName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Chọn "Học không cần đăng nhập" (flows §2) để vào được Dashboard. */
export async function chooseGuest(page: Page) {
  await page.goto('/login');
  await page.getByTestId('continue-as-guest').click();
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
}

/**
 * Bấm "Tiếp tục với Google" và hoàn tất popup giả lập của Auth Emulator.
 * Email chưa có → tạo tài khoản mới; đã có → chọn lại tài khoản đó.
 */
export async function signInWithGoogle(page: Page, email: string, displayName?: string) {
  // Firebase nạp gapi (apis.google.com) cho popup; đợi trang yên mạng rồi mới bấm.
  await page.waitForLoadState('networkidle');
  const popupPromise = page.waitForEvent('popup');
  await page.getByTestId('sign-in-google').click();
  const popup = await popupPromise;
  await popup.waitForLoadState();

  const existing = popup.locator('.js-reuse-account', { hasText: email });
  if (await existing.count()) {
    await existing.click();
  } else {
    await popup.locator('#add-account-button').click();
    await popup.locator('#email-input').fill(email);
    if (displayName) await popup.locator('#display-name-input').fill(displayName);
    await popup.locator('#sign-in').click();
  }
  await popup.waitForEvent('close');
  // Popup đã đóng nhưng thỉnh thoảng SDK không nhận được kết quả (kênh gapi tải từ apis.google.com
  // bị trễ) → nút treo ở trạng thái đang mở, không có request signInWithIdp. Báo rõ để retry xử lý.
  await expect(
    page.locator('[data-testid^="sign-in-"][aria-busy="true"]'),
    'Emulator popup không trả kết quả về trang',
  ).toHaveCount(0, { timeout: 20_000 });
}

/** Tra user trong emulator theo email (REST với token `owner` của emulator). */
export async function lookupEmulatorUser(email: string): Promise<{ localId: string } | null> {
  const res = await fetch(
    `${EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ email: [email] }),
    },
  );
  expect(res.ok).toBe(true);
  const body = (await res.json()) as { users?: { localId: string }[] };
  return body.users?.[0] ?? null;
}

/** Ghi thẻ giả vào store `cards` của DB (DB phải đã được app tạo). Thay cho "học 3 thẻ" tới khi có màn học. */
export async function seedCards(page: Page, dbName: string, count: number) {
  await page.evaluate(
    async ({ dbName, count }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction('cards', 'readwrite');
      for (let i = 0; i < count; i++) {
        tx.objectStore('cards').put({
          id: `e2e-card-${i}`,
          itemType: 'consonant',
          itemId: `c${i}`,
          cardType: 'th-vi',
          createdAt: '2026-03-01T08:00:00.000Z',
          updatedAt: '2026-03-01T08:00:00.000Z',
        });
      }
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    { dbName, count },
  );
}

/** Số thẻ trong DB; `null` nếu DB không tồn tại. */
export async function countCards(page: Page, dbName: string): Promise<number | null> {
  return page.evaluate(async (dbName) => {
    const names = (await indexedDB.databases()).map((d) => d.name);
    if (!names.includes(dbName)) return null;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const count = await new Promise<number>((resolve, reject) => {
      const req = db.transaction('cards').objectStore('cards').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return count;
  }, dbName);
}
