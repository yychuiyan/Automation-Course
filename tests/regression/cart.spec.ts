import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { CartPage } from '@/pages/CartPage';

test.describe('购物车-回归', () => {
  test('购物车 | 删除商品 | 确认后移除', { tag: ['@p1'] }, async ({ page }) => {
    // 先加入购物车
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.clickAddToCart();
    await expect(page.getByText('已加入购物车')).toBeVisible();

    // 去购物车删除
    const cartPage = new CartPage(page);
    await cartPage.goto();
    // 确认有商品
    await expect(page.locator('.ant-list-item').first()).toBeVisible();

    const beforeCount = await page.locator('.ant-list-item').count();

    await cartPage.clickRemove();

    await page.getByRole('button', { name: '确 定' }).click();

    await expect(page.getByText('已移除')).toBeVisible();
    const afterCount = await page.locator('.ant-list-item').count();
    expect(afterCount).toBeLessThan(beforeCount);
  });
});
