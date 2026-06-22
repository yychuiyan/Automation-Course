import { test, expect } from '@playwright/test';

test.describe('通用边界', () => {
  test('边界 | 多标签页并发 | 各页面独立不串号', { tag: ['@p2'] }, async ({ browser }) => {
    const adminContext = await browser.newContext({ storageState: 'auth-admin.json' });
    const page1 = await adminContext.newPage();
    const page2 = await adminContext.newPage();

    await page1.goto('/admin/products');
    await page2.goto('/admin/orders');

    await expect(page1).toHaveURL(/.*admin\/products/);
    await expect(page2).toHaveURL(/.*admin\/orders/);

    await adminContext.close();
  });
});
