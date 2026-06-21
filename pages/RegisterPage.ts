import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 注册页面
 * URL:/register
 */
export class RegisterPage extends BasePage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly genderMale: Locator;
  readonly hobbyMusic: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly phoneInput: Locator;
  readonly agreeCheckbox: Locator;
  readonly submitBtn: Locator;

  constructor(public page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: '用户名' });
    this.emailInput = page.getByRole('textbox', { name: '邮箱' });
    this.passwordInput = page.getByRole('textbox', { name: /密码/ }).first();
    this.confirmPasswordInput = page.getByRole('textbox', { name: '确认密码' });
    this.phoneInput = page.getByRole('textbox', { name: '手机号' });
    this.genderMale = page.getByRole('radio', { name: '男' });
    this.hobbyMusic = page.getByRole('checkbox', { name: '音乐' });
    this.agreeCheckbox = page.getByRole('checkbox', { name: /我已阅读并同意/ });
    this.submitBtn = page.getByRole('button', { name: '注 册' });
  }
  async goto() {
    await this.navigate('/register');
  }
  // 注册
  async register(username: string, email: string, password: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.genderMale.click();
    await this.hobbyMusic.click();
    await this.agreeCheckbox.check();
    await this.submitBtn.click();
  }
}
