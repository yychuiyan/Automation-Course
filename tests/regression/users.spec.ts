import { test, expect } from '@playwright/test';
import { UserListPage } from '@/pages/UserListPage';
import { UserFormPage } from '@/pages/UserFormPage';

test.describe('用户管理-回归', () => {
  test('用户管理 | 角色筛选 | 仅显示对应角色', { tag: ['@p1'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 筛选管理员角色
    await userListPage.rolefilter.click();
    await page.locator('.ant-select-dropdown').getByText('管理员').click();

    // 列表只显示管理员
    await expect(page.locator('.ant-table-row')).toHaveCount(1);
    await expect(page.getByRole('cell', { name: '炊烟1号' }).getByRole('strong')).toBeVisible();
  });
  test('用户管理 | 用户名为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();
    await userListPage.addUserBtn.click();
    await expect(page).toHaveURL(/.*admin\/users\/new/);

    // 不填用户名直接保存
    const userFormPage = new UserFormPage(page);
    await userFormPage.saveBtn.click();

    await expect(page.getByText('请输入用户名')).toBeVisible();
  });
});
