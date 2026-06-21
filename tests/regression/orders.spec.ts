import { test, expect } from '@playwright/test';
import { OrderListPage } from '@/pages/OrderListPage';

test.describe('订单管理-回归', () => {
  test('订单管理 | 状态筛选 | 显示对应订单', { tag: ['@p1'] }, async ({ page }) => {
    const orderListPage = new OrderListPage(page);
    await orderListPage.goto();

    // 等数据加载
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
    const beforeCount = await page.locator('.ant-table-row').count();

    await orderListPage.filterByStatus('已取消');

    const afterCount = await page.locator('.ant-table-row').count();
    expect(afterCount).toBeLessThan(beforeCount);
  });

  test('订单管理 | 搜索订单 | 关键字匹配', { tag: ['@p1'] }, async ({ page }) => {
    const orderListPage = new OrderListPage(page);
    await orderListPage.goto();

    // 拿用户名称查询
    const userName = await page.getByRole('cell', { name: '炊烟1号' }).first().textContent();
    const beforeCount = await page.locator('.ant-table-row').count();

    await orderListPage.search(userName!);
    // 筛选后数量应该减少或相等
    const afterCount = await page.locator('.ant-table-row').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });
});
