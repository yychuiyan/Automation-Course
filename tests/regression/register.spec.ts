import { test, expect } from '@playwright/test';
import { RegisterPage } from '@/pages/RegisterPage';

test.describe('注册-回归', () => {
  let registerPage: RegisterPage;
  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });
  test('注册 | 用户名为空 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.emailInput.fill('yycy@example.com');
    await registerPage.passwordInput.fill('test1234');
    await registerPage.confirmPasswordInput.fill('test1234');

    await registerPage.submitBtn.click();

    await expect(page.getByText('请输入用户名')).toBeVisible();
  });
  test('注册 | 邮箱格式错误 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.emailInput.fill('not-an-email');

    await expect(page.getByText('邮箱格式不正确')).toBeVisible();
  });
  test('注册 | 两次密码不一致 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.passwordInput.fill('test123');
    await registerPage.confirmPasswordInput.fill('different');

    await expect(page.getByText('两次密码输入不一致')).toBeVisible();
  });
  test('注册 | 用户协议未填项 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.usernameInput.fill('test');
    await registerPage.emailInput.fill('yycy@example.com');
    await registerPage.passwordInput.fill('test1234');
    await registerPage.confirmPasswordInput.fill('test1234');

    await registerPage.submitBtn.click();

    await expect(page.getByText('请同意用户协议和隐私政策')).toBeVisible();
  });
});
