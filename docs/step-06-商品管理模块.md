# 第6步：商品管理模块 P0+P1

---

## 产出文件

| 文件                               | 说明                        |
| ---------------------------------- | --------------------------- |
| `pages/ProductListPage.ts`         | 商品列表页                  |
| `pages/ProductFormPage.ts`         | 商品表单页（新增/编辑共用） |
| `tests/smoke/products.spec.ts`     | 冒烟 P0，3 条               |
| `tests/regression/product.spec.ts` | 回归 P1，3 条               |

> 商品新增/编辑/删除仅管理员可操作。`storageState` 自动加载管理员登录态。

---

## `pages/ProductListPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 商品列表页
 * URL: /admin/products
 */
export class ProductListPage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addProductBtn: Locator;
  readonly table: Locator;

  constructor(public page: Page) {
    this.searchInput = page.getByRole('textbox', { name: '搜索商品名' });
    this.categoryFilter = page
      .locator('div')
      .filter({ hasText: /^全部分类$/ })
      .nth(4);
    this.addProductBtn = page.getByRole('button', { name: '新增商品' });
    this.table = page.locator('.ant-table');
  }

  async goto() {
    await this.page.goto('/admin/products');
  }

  // 按名称搜索
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
  }

  // 商品编辑 — 点第一行的编辑按钮
  async clickEdit() {
    await this.page.getByRole('button', { name: 'edit' }).first().click();
  }

  // 商品删除 — 点第一行的删除按钮
  async clickDelete() {
    await this.page.getByRole('button', { name: 'delete' }).first().click();
  }
}
```

| 代码             | 作用                               |
| ---------------- | ---------------------------------- |
| `categoryFilter` | 分类下拉，Inspector 推荐的组合定位 |
| `clickEdit()`    | 点第一行编辑按钮，进入编辑页       |
| `clickDelete()`  | 点第一行删除按钮，触发确认弹窗     |

---

## `pages/ProductFormPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 商品表单页（新增/编辑共用）
 * URL: /admin/products/new 或 /admin/products/:id
 */
export class ProductFormPage {
  readonly nameInput: Locator;
  readonly priceInput: Locator;
  readonly saveBtn: Locator;

  constructor(public page: Page) {
    this.nameInput = page.getByRole('textbox', { name: '商品名称' });
    this.priceInput = page.getByRole('spinbutton', { name: '价格' });
    this.saveBtn = page.getByRole('button', { name: '保存' });
  }

  async goto() {
    await this.page.goto('/admin/products/new');
  }

  // 新增商品
  async create(name: string, price: string) {
    await this.nameInput.fill(name);
    await this.priceInput.fill(price);
    await this.saveBtn.click();
  }

  // 编辑商品名
  async editName(newName: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveBtn.click();
  }
}
```

| 代码         | 作用                                         |
| ------------ | -------------------------------------------- |
| `spinbutton` | Ant Design InputNumber 的 role，不是 textbox |
| `create()`   | 封装 fill + 保存，冒烟用例一行调用           |
| `editName()` | 清空旧名 → 填新名 → 保存                     |

---

## `tests/smoke/products.spec.ts`（P0 冒烟）

```typescript
import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { ProductFormPage } from '@/pages/ProductFormPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('商品管理-冒烟', () => {
  test('商品管理 | 查看列表 | 数据展示', { tag: ['@p0'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    await expect(productListPage.table).toBeVisible();
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
  });

  test('商品管理 | 分类筛选 | 显示对应商品', { tag: ['@p0'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    // 记录全量行数
    const beforeCount = await page.locator('.ant-table-row').count();
    // 筛选分类
    await productListPage.categoryFilter.click();
    // 等下拉出来
    await expect(page.locator('.ant-select-dropdown')).toBeVisible();
    // 点具体分类，不依赖 position（DOM 重排后 first() 会失稳）
    await page.locator('.ant-select-dropdown').getByText('手机数码').click();
    // 筛选后对应行数减少
    const afterCount = await page.locator('.ant-table-row').count();
    expect(afterCount).toBeLessThan(beforeCount);
  });

  test('商品管理 | 新增商品 | 创建成功', { tag: ['@p0'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.addProductBtn.click();
    await expect(page).toHaveURL(/.*admin\/products\/new/);

    const productFormPage = new ProductFormPage(page);
    await productFormPage.create(DataGenerator.productName(), '99');

    await expect(page).toHaveURL(/.*admin\/products/);
    await expect(page.getByText('商品创建成功')).toBeVisible();
  });
});
```

| 代码                       | 作用                                        |
| -------------------------- | ------------------------------------------- |
| `beforeCount > afterCount` | 不依赖固定筛选结果数，种子数据变化也不影响  |
| `getByText('手机数码')`    | 指定分类名而非 `first()`，避免 DOM 重排     |
| `spinbutton` 填价格        | InputNumber 用 fill 即可，Playwright 能处理 |

---

## `tests/regression/product.spec.ts`（P1 回归）

```typescript
import { test, expect } from '@playwright/test';
import { ProductListPage } from '@/pages/ProductListPage';
import { ProductFormPage } from '@/pages/ProductFormPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('商品管理-回归', () => {
  test('商品管理 | 编辑商品 | 保存后信息更新', { tag: ['@p1'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    // 点击编辑
    await productListPage.clickEdit();
    await expect(page).toHaveURL(/.*admin\/products\//);
    // 修改商品名
    const newName = DataGenerator.productName();
    const productFormPage = new ProductFormPage(page);
    await productFormPage.editName(newName);

    // 回到列表，验证新名可见
    await expect(page).toHaveURL(/.*admin\/products/);
    await expect(page.getByText('商品更新成功')).toBeVisible();
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('商品管理 | 删除商品 | 二次确认后移除', { tag: ['@p1'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();

    // 先新增一个商品，确保有可删除的目标
    await productListPage.addProductBtn.click();
    const name = DataGenerator.productName();
    const productFormPage = new ProductFormPage(page);
    await productFormPage.create(name, '99');
    await expect(page).toHaveURL(/.*admin\/products/);

    // 删除它
    await productListPage.search(name);
    await productListPage.clickDelete();
    // 确认弹窗
    await page.getByRole('button', { name: '确 定' }).click();

    // 删除成功
    await expect(page.getByText('商品已删除')).toBeVisible();
  });

  test('商品管理 | 商品名为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    const productListPage = new ProductListPage(page);
    await productListPage.goto();
    await productListPage.addProductBtn.click();
    await expect(page).toHaveURL(/.*admin\/products\/new/);

    // 不填名称直接保存
    const productFormPage = new ProductFormPage(page);
    await productFormPage.saveBtn.click();

    await expect(page.getByText('请输入商品名称')).toBeVisible();
  });
});
```

| 代码                  | 作用                                                  |
| --------------------- | ----------------------------------------------------- |
| 删除前先新增          | 种子数据只有 8 条且可能受保护，新增一个确保有可删目标 |
| 搜索后删              | 精准定位新增的商品行                                  |
| `clear()` 再 `fill()` | 编辑时旧名可能没清干净，加 clear 兜底                 |

---

## 用例对照表

|  编号  | 优先级 | 标签 | 标题                                   | 文件                       |
| :----: | :----: | ---- | -------------------------------------- | -------------------------- |
| TC-P01 |   P0   | @p0  | 商品管理 \| 查看列表 \| 数据展示       | smoke/products.spec.ts     |
| TC-P02 |   P0   | @p0  | 商品管理 \| 分类筛选 \| 显示对应商品   | smoke/products.spec.ts     |
| TC-P03 |   P0   | @p0  | 商品管理 \| 新增商品 \| 创建成功       | smoke/products.spec.ts     |
| TC-P04 |   P1   | @p1  | 商品管理 \| 编辑商品 \| 保存后信息更新 | regression/product.spec.ts |
| TC-P05 |   P1   | @p1  | 商品管理 \| 删除商品 \| 二次确认后移除 | regression/product.spec.ts |
| TC-P06 |   P1   | @p1  | 商品管理 \| 商品名为空 \| 提示必填     | regression/product.spec.ts |

---

## 验证命令

```bash
# 冒烟
npx playwright test tests/smoke/products.spec.ts --headed

# 回归
npx playwright test tests/regression/product.spec.ts --headed
```
