import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 商品列表页
 * URL: /admin/products
 */
export class ProductListPage extends BasePage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addProductBtn: Locator;
  readonly table: Locator;

  constructor(public page: Page) {
    super(page);
    this.searchInput = page.getByRole('textbox', { name: '搜索商品名' });
    this.categoryFilter = page
      .locator('div')
      .filter({ hasText: /^全部分类$/ })
      .nth(4);
    this.addProductBtn = page.getByRole('button', { name: '新增商品' });
    this.table = page.locator('.ant-table');
  }
  async goto() {
    await this.navigate('/admin/products');
  }
  // 按名称搜索
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
  }
  // 商品编辑
  async clickEdit() {
    await this.page.getByRole('button', { name: 'edit' }).first().click();
  }
  // 商品删除
  async clickDelete() {
    await this.page.getByRole('button', { name: 'delete' }).first().click();
  }
  // 加入购物车
  async clickAddToCart() {
    await this.page.getByRole('button', { name: 'shopping-cart' }).first().click();
  }
}
