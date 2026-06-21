import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
/**
 * 用户新增页面
 * URL: /admin/users/new
 */

export class UserFormPage extends BasePage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(public page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: '用户名' });
    this.emailInput = page.getByRole('textbox', { name: '邮箱' });
    this.passwordInput = page.getByRole('textbox', { name: '密码' });
    this.saveBtn = page.getByRole('button', { name: '保存' });
    this.cancelBtn = page.getByRole('button', { name: '取 消' });
  }
  async goto() {
    await this.navigate('/admin/users/new');
  }
  // 新增用户保存
  async create(username: string, email: string, password: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.saveBtn.click();
  }
}
