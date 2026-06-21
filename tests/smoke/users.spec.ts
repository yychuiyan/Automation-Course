import { test, expect } from '@playwright/test';
import { UserListPage } from '@/pages/UserListPage';
import { UserFormPage } from '@/pages/UserFormPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('用户管理-冒烟', () => {
  test('用户管理 | 查看列表 | 分页加载', { tag: ['@p0'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 表格可见，有数据行
    await expect(userListPage.table).toBeVisible();
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
  });
  test('用户管理 | 关键词搜索 | 筛选结果', { tag: ['@p0'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 搜索已知用户
    await userListPage.search('炊烟');
    // 等待搜索加载
    await expect(page.locator('.ant-table-row')).toHaveCount(2);
    await expect(page.getByRole('cell', { name: '炊烟1号' }).getByRole('strong')).toBeVisible();
  });
  test('用户管理 | 新增用户 | 创建成功', { tag: ['@p0'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 点击新增
    await userListPage.addUserBtn.click();
    await expect(page).toHaveURL(/.*admin\/users\/new/);

    // 填写表单
    const username = DataGenerator.username();
    const userFormPage = new UserFormPage(page);
    await userFormPage.create(username, DataGenerator.email(), 'test1234');

    // 成功后跳转回列表
    await expect(page).toHaveURL(/.*admin\/users/);
    await expect(page.getByText('用户创建成功')).toBeVisible();
  });
});
