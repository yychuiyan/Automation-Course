import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { ProductFormPage } from '@/pages/ProductFormPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('商品管理-回归', () => {
  test('商品管理 | 编辑商品 | 保存后信息更新', { tag: ['@p1'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    // 点击编辑
    await productListPage.clickEdit();
    await expect(page).toHaveURL(/.*admin\/products\//);
    // 修改商品名
    const newName = DataGenerator.productName();
    const productFormPage = new ProductFormPage(page);
    await productFormPage.editName(newName);

    // 回到列表，验证新名可见
    await expect(page).toHaveURL(/.*admin\/products/);
    await expect(page.getByText('商品更新成功')).toBeVisible();
    await expect(page.getByText(newName)).toBeVisible();
  });
  test('商品管理 | 删除商品 | 二次确认后移除', { tag: ['@p1'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    // 先新增一个商品，确保有可删除的目标
    await productListPage.addProductBtn.click();
    const name = DataGenerator.productName();
    const productFormPage = new ProductFormPage(page);
    await productFormPage.create(name, '99');
    await expect(page).toHaveURL(/.*admin\/products/);

    // 删除它
    await productListPage.search(name);
    await productListPage.clickDelete();
    // 确认弹窗
    await page.getByRole('button', { name: '确 定' }).click();

    // 删除成功
    await expect(page.getByText('商品已删除')).toBeVisible();
  });

  test('商品管理 | 商品名为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.addProductBtn.click();
    await expect(page).toHaveURL(/.*admin\/products\/new/);

    // 不填名称直接保存
    const productFormPage = new ProductFormPage(page);
    await productFormPage.saveBtn.click();

    await expect(page.getByText('请输入商品名称')).toBeVisible();
  });
});
