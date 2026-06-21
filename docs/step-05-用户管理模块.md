# 第4步：用户管理模块 P0+P1

---

## 产出文件

| 文件                             | 说明               |
| -------------------------------- | ------------------ |
| `pages/UserListPage.ts`          | 用户列表页         |
| `pages/UserFormPage.ts`          | 用户表单页（新增） |
| `tests/smoke/users.spec.ts`      | 冒烟 P0，3 条      |
| `tests/regression/users.spec.ts` | 回归 P1，2 条      |

> 用户管理页仅管理员可访问。`chromium-admin` 项目通过 `storageState` 自动加载管理员登录态，用例无需手动登录。

---

## `pages/UserListPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 用户列表页
 * URL: /admin/users 管理员访问
 */
export class UserListPage {
  readonly searchInput: Locator;
  readonly rolefilter: Locator;
  readonly addUserBtn: Locator;
  readonly table: Locator;

  constructor(public page: Page) {
    this.searchInput = page.getByRole('textbox', { name: '搜索用户名或邮箱' });
    this.rolefilter = page
      .locator('div')
      .filter({ hasText: /^全部角色$/ })
      .nth(4);
    this.addUserBtn = page.getByRole('button', { name: '新增用户' });
    this.table = page.getByRole('combobox').first();
  }

  async goto() {
    await this.page.goto('/admin/users');
  }

  // 搜索用户
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
  }
}
```

| 代码          | 作用                                   |
| ------------- | -------------------------------------- |
| `searchInput` | 搜索框，通过 role + name 定位          |
| `rolefilter`  | 角色筛选下拉，Inspector 推荐的定位方式 |
| `addUserBtn`  | 进入新增用户页的按钮                   |
| `table`       | 用户数据表格区域                       |

---

## `pages/UserFormPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 用户新增页面
 * URL: /admin/users/new
 */
export class UserFormPage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(public page: Page) {
    this.usernameInput = page.getByRole('textbox', { name: '用户名' });
    this.emailInput = page.getByRole('textbox', { name: '邮箱' });
    this.passwordInput = page.getByRole('textbox', { name: '密码' });
    this.saveBtn = page.getByRole('button', { name: '保存' });
    this.cancelBtn = page.getByRole('button', { name: '取 消' });
  }

  async goto() {
    await this.page.goto('/admin/users/new');
  }

  // 新增用户保存
  async create(username: string, email: string, password: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.saveBtn.click();
  }
}
```

| 代码                                    | 作用                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `getByRole('textbox', { name: '...' })` | Ant Design Input 渲染 textbox 角色，通过 label 文字匹配 |
| `create()`                              | 封装 fill + click 保存                                  |
| `saveBtn`                               | 提交按钮，空值场景直接点触发表单校验                    |
| `cancelBtn`                             | 返回按钮                                                |

---

## `tests/smoke/users.spec.ts`（P0 冒烟）

```typescript
import { test, expect } from '@playwright/test';
import { UserListPage } from '@/pages/UserListPage';
import { UserFormPage } from '@/pages/UserFormPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('用户管理-冒烟', () => {
  test('用户管理 | 查看列表 | 分页加载', { tag: ['@p0'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 表格可见，有数据行
    await expect(userListPage.table).toBeVisible();
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
  });

  test('用户管理 | 关键词搜索 | 筛选结果', { tag: ['@p0'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 搜索已知用户
    await userListPage.search('炊烟');
    // 等待搜索加载
    await expect(page.locator('.ant-table-row')).toHaveCount(2);
    await expect(page.getByRole('cell', { name: '炊烟1号' }).getByRole('strong')).toBeVisible();
  });

  test('用户管理 | 新增用户 | 创建成功', { tag: ['@p0'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 点击新增
    await userListPage.addUserBtn.click();
    await expect(page).toHaveURL(/.*admin\/users\/new/);

    // 填写表单
    const username = DataGenerator.username();
    const userFormPage = new UserFormPage(page);
    await userFormPage.create(username, DataGenerator.email(), 'test1234');

    // 成功后跳转回列表，Toast 提示成功
    await expect(page).toHaveURL(/.*admin\/users/);
    await expect(page.getByText('用户创建成功')).toBeVisible();
  });
});
```

| 代码                                 | 作用                                                  |
| ------------------------------------ | ----------------------------------------------------- |
| 无 `beforeEach` 登录                 | `storageState` 已自动加载管理员登录态，直接 goto 即可 |
| `DataGenerator.username()`           | 每次跑生成唯一用户名，避免重复                        |
| `toHaveCount(2)`                     | 搜"炊烟"预期 2 条结果（炊烟1号 + 炊烟2号）            |
| `getByRole('cell', { name: '...' })` | 定位表格单元格，比直接 getByText 精确                 |
| 断言 Toast 而非新增用户名            | 新增后可能不在第一页，Toast 提示更稳定                |

---

## `tests/regression/users.spec.ts`（P1 回归）

```typescript
import { test, expect } from '@playwright/test';
import { UserListPage } from '@/pages/UserListPage';
import { UserFormPage } from '@/pages/UserFormPage';

test.describe('用户管理-回归', () => {
  test('用户管理 | 角色筛选 | 仅显示对应角色', { tag: ['@p1'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();

    // 筛选管理员角色
    await userListPage.rolefilter.click();
    // Ant Design 下拉菜单渲染在 body 下，加 .ant-select-dropdown 限定范围
    await page.locator('.ant-select-dropdown').getByText('管理员').click();

    // 列表中只显示管理员
    await expect(page.locator('.ant-table-row')).toHaveCount(1);
    await expect(page.getByRole('cell', { name: '炊烟1号' }).getByRole('strong')).toBeVisible();
  });

  test('用户管理 | 用户名为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    const userListPage = new UserListPage(page);
    await userListPage.goto();
    await userListPage.addUserBtn.click();
    await expect(page).toHaveURL(/.*admin\/users\/new/);

    // 不填用户名直接保存触发表单校验
    const userFormPage = new UserFormPage(page);
    await userFormPage.saveBtn.click();

    await expect(page.getByText('请输入用户名')).toBeVisible();
  });
});
```

| 代码                            | 作用                                                                    |
| ------------------------------- | ----------------------------------------------------------------------- |
| `.ant-select-dropdown` 限定范围 | `getByText('管理员')` 会匹配表格内的标签文字，加 class 限定只找下拉菜单 |
| `toHaveCount(1)`                | 筛选管理员后只有 1 条数据（炊烟1号）                                    |
| `saveBtn.click()` 跳过 fill     | 空值场景直接点保存，触发 Ant Design 表单校验                            |

---

## 用例对照表

|  编号  | 优先级 | 标签 | 标题                                   | 文件                     |
| :----: | :----: | ---- | -------------------------------------- | ------------------------ |
| TC-U01 |   P0   | @p0  | 用户管理 \| 查看列表 \| 分页加载       | smoke/users.spec.ts      |
| TC-U02 |   P0   | @p0  | 用户管理 \| 关键词搜索 \| 筛选结果     | smoke/users.spec.ts      |
| TC-U03 |   P0   | @p0  | 用户管理 \| 新增用户 \| 创建成功       | smoke/users.spec.ts      |
| TC-U04 |   P1   | @p1  | 用户管理 \| 角色筛选 \| 仅显示对应角色 | regression/users.spec.ts |
| TC-U05 |   P1   | @p1  | 用户管理 \| 用户名为空 \| 提示必填     | regression/users.spec.ts |

---

## 验证命令

```bash
# 冒烟
npm run test:smoke

# 回归
npm run test:regression

# 单文件
npx playwright test tests/smoke/users.spec.ts --headed
npx playwright test tests/regression/users.spec.ts --headed
```
