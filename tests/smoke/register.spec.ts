import { test, expect } from '@playwright/test';
import { RegisterPage } from '@/pages/RegisterPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('注册-冒烟', () => {
  let registerPage: RegisterPage;
  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('注册 | 填写完整信息 | 跳转登录页', { tag: ['@p0'] }, async ({ page }) => {
    await registerPage.register(DataGenerator.username(), DataGenerator.email(), 'test123456');

    // 模拟注册成功后跳转到登录页面
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('注册成功')).toBeVisible();
  });
});
