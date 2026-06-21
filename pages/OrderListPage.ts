import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 订单页
 * URL: /admin/orders
 */

export class OrderListPage extends BasePage {
  readonly searchInput: Locator;
  readonly table: Locator;

  constructor(public page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('搜索订单号或用户名...');
    this.table = page.locator('.ant-table');
  }

  async goto() {
    await this.navigate('/admin/orders');
  }

  // 按状态筛选
  async filterByStatus(status: string) {
    await this.page.locator('.ant-segmented').getByText(status).click();
  }
  // 搜索订单
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
  }
  // 查看详情
  async clickView() {
    await this.page.getByRole('button', { name: 'eye' }).first().click();
  }
}
