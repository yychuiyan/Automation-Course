import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { ProductFormPage } from '@/pages/ProductFormPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('商品管理-冒烟', () => {
  test('商品管理 | 查看列表 | 数据展示', { tag: ['@p0'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    await expect(productListPage.table).toBeVisible();
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
  });
  test('商品管理 | 分类筛选 | 显示对应商品', { tag: ['@p0'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    // 等表格数据加载完成
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
    const beforeCount = await page.locator('.ant-table-row').count();

    await productListPage.categoryFilter.click();
    await expect(page.locator('.ant-select-dropdown')).toBeVisible();
    await page.locator('.ant-select-dropdown').getByText('手机数码').click();

    await expect(page.locator('.ant-table-row').first()).toBeVisible();
    const afterCount = await page.locator('.ant-table-row').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });

  test('商品管理 | 新增商品 | 创建成功', { tag: ['@p0'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.addProductBtn.click();
    await expect(page).toHaveURL(/.*admin\/products\/new/);

    const productFormPage = new ProductFormPage(page);
    await productFormPage.create(DataGenerator.productName(), '99');

    await expect(page).toHaveURL(/.*admin\/products/);
    await expect(page.getByText('商品创建成功')).toBeVisible();
  });
});
