import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { CartPage } from '@/pages/CartPage';

test.describe('购物车-冒烟', () => {
  test('购物车 | 加入商品 | 购物车展示', { tag: ['@p0'] }, async ({ page }) => {
    // 先去商品列表添加购物车
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.clickAddToCart();
    await expect(page.getByText('已加入购物车')).toBeVisible();

    // 进入购物车页面
    const cartPage = new CartPage(page);
    await cartPage.goto();

    await expect(page.locator('.ant-list-item').first()).toBeVisible();
    await expect(page.getByText(/合计/)).toBeVisible();
  });
});
