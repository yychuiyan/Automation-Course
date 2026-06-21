import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

test.describe('登录-边界', async () => {
  let loginPage: LoginPage;
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('登录 | 快速双击按钮 | 不重复提交', { tag: ['@p2'] }, async ({ page }) => {
    // 快速双击登录
    await loginPage.usernameInput.fill(config.admin.username);
    await loginPage.passwordInput.fill(config.admin.password);
    await loginPage.loginButton.dblclick();
    // 正常跳转一次，不会因为重复提交出问题
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });
});
