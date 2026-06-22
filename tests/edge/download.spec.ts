import { test, expect } from '@playwright/test';

test.describe('文件下载-边界', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/download');
  });

  test('下载 | a标签方式 | 文件保存成功', { tag: ['@p2'] }, async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-link-btn').click(),
    ]);

    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('下载 | fetch方式 | 文件保存成功', { tag: ['@p2'] }, async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-txt-btn').click()]);

    expect(download.suggestedFilename()).toBeTruthy();
  });
});
