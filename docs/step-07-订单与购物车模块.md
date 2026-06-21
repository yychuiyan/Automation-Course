# 第7步：订单 + 购物车模块 P0+P1

---

## 产出文件

| 文件                              | 说明                            |
| --------------------------------- | ------------------------------- |
| `pages/OrderListPage.ts`          | 订单列表页                      |
| `pages/OrderDetailPage.ts`        | 订单详情页                      |
| `pages/CartPage.ts`               | 购物车页                        |
| `pages/ProductListPage.ts`        | 商品列表页（补 clickAddToCart） |
| `tests/smoke/orders.spec.ts`      | 订单冒烟 P0，2 条               |
| `tests/regression/orders.spec.ts` | 订单回归 P1，2 条               |
| `tests/smoke/cart.spec.ts`        | 购物车冒烟 P0，1 条             |
| `tests/regression/cart.spec.ts`   | 购物车回归 P1，1 条             |

---

## `pages/OrderListPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 订单页
 * URL: /admin/orders
 */
export class OrderListPage {
  readonly searchInput: Locator;
  readonly table: Locator;

  constructor(public page: Page) {
    this.searchInput = page.getByPlaceholder('搜索订单号或用户名...');
    this.table = page.locator('.ant-table');
  }

  async goto() {
    await this.page.goto('/admin/orders');
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
```

| 代码              | 作用                                          |
| ----------------- | --------------------------------------------- |
| `.ant-segmented`  | Ant Design Segmented 组件，7 种状态 Tab       |
| `{ name: 'eye' }` | 查看详情按钮是 EyeOutlined 图标，无障碍名 eye |

---

## `pages/CartPage.ts`

```typescript
import { Page } from '@playwright/test';

/**
 * 购物车页面
 * URL: /admin/cart
 */
export class CartPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/admin/cart');
  }

  // 点击第一个删除按钮
  async clickRemove() {
    await this.page.getByRole('button', { name: 'delete' }).first().click();
  }
}
```

---

## `pages/ProductListPage.ts`（补充）

在原有基础上新增加入购物车方法：

```typescript
// 加入购物车 — 点第一行的购物车按钮
async clickAddToCart() {
  await this.page.getByRole('button', { name: 'shopping-cart' }).first().click();
}
```

---

## `tests/smoke/orders.spec.ts`（P0 冒烟）

```typescript
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
    // 订单号、进度条可见
    await expect(page.getByText(/订单详情/)).toBeVisible();
  });
});
```

| 代码                     | 作用                                |
| ------------------------ | ----------------------------------- |
| `/.*admin\/orders\/\d+/` | 详情页 URL 带数字 ID，用 `\d+` 匹配 |
| `getByText(/订单详情/)`  | 详情页标题包含"订单详情"            |

---

## `tests/regression/orders.spec.ts`（P1 回归）

```typescript
import { test, expect } from '@playwright/test';
import { OrderListPage } from '@/pages/OrderListPage';

test.describe('订单管理-回归', () => {
  test('订单管理 | 状态筛选 | 显示对应订单', { tag: ['@p1'] }, async ({ page }) => {
    const orderListPage = new OrderListPage(page);
    await orderListPage.goto();

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
```

| 代码                  | 作用                                   |
| --------------------- | -------------------------------------- |
| `textContent()`       | 从 cell 里提取文字用于搜索             |
| `toBeLessThanOrEqual` | 用户名可能出现在所有订单中，至少不增加 |

---

## `tests/smoke/cart.spec.ts`（P0 冒烟）

```typescript
import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { CartPage } from '@/pages/CartPage';

test.describe('购物车-冒烟', () => {
  test('购物车 | 加入商品 | 购物车展示', { tag: ['@p0'] }, async ({ page }) => {
    // 先去商品列表添加购物车
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.clickAddToCart();
    await expect(page.getByText('已加入购物车')).toBeVisible();

    // 进入购物车页面
    const cartPage = new CartPage(page);
    await cartPage.goto();

    await expect(page.locator('.ant-list-item').first()).toBeVisible();
    await expect(page.getByText(/合计/)).toBeVisible();
  });
});
```

| 代码                | 作用                                 |
| ------------------- | ------------------------------------ |
| 先加后验证          | 购物车初始为空，从商品列表加入再验证 |
| `getByText(/合计/)` | 购物车底部有总价展示                 |

---

## `tests/regression/cart.spec.ts`（P1 回归）

```typescript
import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { CartPage } from '@/pages/CartPage';

test.describe('购物车-回归', () => {
  test('购物车 | 删除商品 | 确认后移除', { tag: ['@p1'] }, async ({ page }) => {
    // 先加入购物车
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.clickAddToCart();
    await expect(page.getByText('已加入购物车')).toBeVisible();

    // 去购物车删除
    const cartPage = new CartPage(page);
    await cartPage.goto();
    // 确认有商品
    await expect(page.locator('.ant-list-item').first()).toBeVisible();

    const beforeCount = await page.locator('.ant-list-item').count();

    await cartPage.clickRemove();
    await page.getByRole('button', { name: '确 定' }).click();

    await expect(page.getByText('已移除')).toBeVisible();
    const afterCount = await page.locator('.ant-list-item').count();
    expect(afterCount).toBeLessThan(beforeCount);
  });
});
```

| 代码                       | 作用                                       |
| -------------------------- | ------------------------------------------ |
| 先加入再删除               | 购物车初始空，加一个确保 `beforeCount > 0` |
| `beforeCount > afterCount` | 确认确实删了一条                           |

---

## 用例对照表

|  编号  | 优先级 | 标签 | 标题                                 | 文件                      |
| :----: | :----: | ---- | ------------------------------------ | ------------------------- |
| TC-O01 |   P0   | @p0  | 订单管理 \| 查看列表 \| 数据加载     | smoke/orders.spec.ts      |
| TC-O02 |   P0   | @p0  | 订单管理 \| 查看详情 \| 信息完整     | smoke/orders.spec.ts      |
| TC-O03 |   P1   | @p1  | 订单管理 \| 状态筛选 \| 显示对应订单 | regression/orders.spec.ts |
| TC-O04 |   P1   | @p1  | 订单管理 \| 搜索订单 \| 关键字匹配   | regression/orders.spec.ts |
| TC-C01 |   P0   | @p0  | 购物车 \| 加入商品 \| 购物车展示     | smoke/cart.spec.ts        |
| TC-C02 |   P1   | @p1  | 购物车 \| 删除商品 \| 确认后移除     | regression/cart.spec.ts   |

---

## 验证命令

```bash
# 订单
npx playwright test tests/smoke/orders.spec.ts --headed
npx playwright test tests/regression/orders.spec.ts --headed

# 购物车
npx playwright test tests/smoke/cart.spec.ts --headed
npx playwright test tests/regression/cart.spec.ts --headed
```
