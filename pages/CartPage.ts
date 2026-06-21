import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 购物车页面
 * URL:/admin/cart
 */

export class CartPage extends BasePage {
  constructor(public page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate('/admin/cart');
  }

  // 点击删除按钮
  async clickRemove() {
    await this.page.getByRole('button', { name: 'delete' }).first().click();
  }
}
