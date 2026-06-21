import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 用户列表页
 * URL: /admin/users
 */
export class UserListPage extends BasePage {
  readonly searchInput: Locator;
  readonly rolefilter: Locator;
  readonly addUserBtn: Locator;
  readonly table: Locator;

  constructor(public page: Page) {
    super(page);
    this.searchInput = page.getByRole('textbox', { name: '搜索用户名或邮箱' });
    this.rolefilter = page
      .locator('div')
      .filter({ hasText: /^全部角色$/ })
      .nth(4);
    this.addUserBtn = page.getByRole('button', { name: '新增用户' });
    this.table = page.getByRole('combobox').first();
  }
  async goto() {
    await this.navigate('/admin/users');
  }
  // 搜索用户
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
  }
  // 获取表格数据
  async getRowCount(): Promise<number> {
    return this.table.locator('.ant-table-row').count();
  }
}
