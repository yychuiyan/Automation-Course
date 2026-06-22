import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('图片上传-边界', () => {
  test('上传 | 单张图片 | 上传成功', { tag: ['@p2'] }, async ({ page }) => {
    await page.goto('/admin/products/new');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('上传图片').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(path.resolve(__dirname, '../../data/test-image.png'));
  });
});
