import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

setup('管理员登录-保存状态', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.admin.username, config.admin.password);
  await expect(page).toHaveURL(/.*admin\/dashboard/);

  await page.context().storageState({ path: 'auth-admin.json' });
});
setup('普通用户登录-保存状态', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.user.username, config.user.password);
  await expect(page).toHaveURL(/.*admin\/dashboard/);

  await page.context().storageState({ path: 'auth-user.json' });
});
