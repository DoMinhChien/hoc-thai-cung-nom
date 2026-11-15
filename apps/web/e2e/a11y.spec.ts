import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTE_SAMPLES } from '../src/app/route-samples';

const PATHS = [...ROUTE_SAMPLES.map((r) => r.path), '/dev/typography'];

for (const path of PATHS) {
  test(`axe: ${path} không có lỗi serious/critical`, async ({ page }) => {
    await page.goto(path);
    await page.locator('main').first().waitFor();
    const { violations } = await new AxeBuilder({ page }).analyze();
    const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(severe.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
