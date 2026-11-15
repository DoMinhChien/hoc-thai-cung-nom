import { chromium, type FullConfig } from '@playwright/test';
import { signInWithGoogle, uniqueEmail } from './helpers';

/**
 * Làm "nóng" luồng popup của Auth Emulator một lần trước khi chạy test: lần đăng nhập đầu tiên sau
 * khi emulator vừa khởi động đôi khi không trả kết quả về trang (treo ở "Đang mở…").
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;
  const browser = await chromium.launch();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const page = await browser.newPage({ baseURL });
      try {
        await page.goto('/login');
        await signInWithGoogle(page, uniqueEmail('warmup', 'setup'), 'Warmup');
        await page.getByTestId('display-name-dialog').waitFor({ timeout: 20_000 });
        return;
      } catch {
        // thử lại một lần; nếu vẫn lỗi thì để test tự báo
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
