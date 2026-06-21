import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 订单详情页
 * URL: /admin/orders/:id
 */

export class OrderDetailPage extends BasePage {
  constructor(public page: Page) {
    super(page);
  }
  async goto(orderId: number) {
    await this.navigate(`/admin/orders/${orderId}`);
  }
}
