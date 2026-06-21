import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

test.describe('登录-冒烟', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });
  // 管理员登录
  test('登录 | 正确账号密码 | 跳转到首页', { tag: ['@p0'] }, async ({ page }) => {
    await loginPage.login(config.admin.username, config.admin.password);
    // 断言 自动等待
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });
  // 普通用户
  test('登录 | 普通用户 | 进入后台只读页面', { tag: ['@p0'] }, async ({ page }) => {
    await loginPage.login(config.user.username, config.user.password);
    // 断言 自动等待
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });
});
