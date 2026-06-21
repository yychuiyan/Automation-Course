import { test, expect } from '@playwright/test';
import { OrderListPage } from '@/pages/OrderListPage';

test.describe('订单管理-冒烟', () => {
  test('订单管理 | 查看列表 | 数据加载', { tag: ['@p0'] }, async ({ page }) => {
    const orderListPage = new OrderListPage(page);
    await orderListPage.goto();

    await expect(orderListPage.table).toBeVisible();
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
  });
  test('订单管理 | 查看详情 | 信息完整', { tag: ['@p0'] }, async ({ page }) => {
    const orderListPage = new OrderListPage(page);
    await orderListPage.goto();

    await orderListPage.clickView();
    // 跳转到详情页
    await expect(page).toHaveURL(/.*admin\/orders\/\d+/);
    // 订单号、进度条课件
    await expect(page.getByText(/订单详情/)).toBeVisible();
  });
});
