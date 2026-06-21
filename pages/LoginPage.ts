import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 登录页
 * URL:/login
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  // 初始化函数
  constructor(public page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('login-username-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-btn');
  }

  // 打开登录页
  async goto() {
    await this.navigate('/login');
  }
  // 填写表单点击登录
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
