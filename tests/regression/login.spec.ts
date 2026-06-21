import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

test.describe('登录-回归', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('登录 | 密码错误 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await loginPage.login(config.admin.username, 'wrong-password');

    // 错误断言
    await expect(page.getByText('用户名或密码错误')).toBeVisible();
    // 页面
    await expect(page).toHaveURL(/.*login/);
  });
  test('登录 | 用户名为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    await loginPage.loginButton.click();

    await expect(page.getByText('请输入用户名')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
  test('登录 | 密码为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    await loginPage.usernameInput.fill(config.admin.username);
    await loginPage.loginButton.click();

    await expect(page.getByText('请输入密码')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
