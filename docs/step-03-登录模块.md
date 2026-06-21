# 第3步：登录模块 P0+P1

---

## 产出文件

| 文件                             | 说明               |
| -------------------------------- | ------------------ |
| `pages/LoginPage.ts`             | 登录页 Page Object |
| `tests/smoke/login.spec.ts`      | 冒烟 P0，2 条      |
| `tests/regression/login.spec.ts` | 回归 P1，3 条      |

---

## `pages/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 登录页
 * URL: /login
 */
export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  // 初始化函数
  constructor(public page: Page) {
    this.usernameInput = page.getByText('用户名');
    this.passwordInput = page.getByText('密码');
    this.loginButton = page.getByRole('button', { name: '登 录' });
  }

  // 打开登录页
  async goto() {
    await this.page.goto('/login');
  }

  // 填写表单点击登录
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

| 代码                                     | 作用                                    |
| ---------------------------------------- | --------------------------------------- |
| `getByText('用户名')`                    | 通过标签文字定位输入框，Inspector 推荐  |
| `getByRole('button', { name: '登 录' })` | 语义化定位按钮                          |
| `goto()`                                 | 打开 /login，用相对路径配合 baseURL     |
| `login()`                                | 封装 fill + click，用例一行搞定         |
| `public page`                            | 允许外部直接访问 page，处理封装外的操作 |

---

## `tests/smoke/login.spec.ts`（P0 冒烟）

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

test.describe('登录-冒烟', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // 管理员登录
  test('登录 | 正确账号密码 | 跳转到首页', { tag: ['@p0'] }, async ({ page }) => {
    await loginPage.login(config.admin.username, config.admin.password);
    // 断言 自动等待
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });

  // 普通用户
  test('登录 | 普通用户 | 进入后台只读页面', { tag: ['@p0'] }, async ({ page }) => {
    await loginPage.login(config.user.username, config.user.password);
    // 断言 自动等待
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });
});
```

| 代码                              | 作用                                        |
| --------------------------------- | ------------------------------------------- |
| `@/pages/LoginPage`               | `@` = 项目根目录，路径别名                  |
| `test.describe('登录-冒烟')`      | 用例分组，报告里归类显示                    |
| `test.beforeEach`                 | 每个 test 前重新打开登录页，保证独立        |
| `config.admin.username`           | 从 config 拿账号，不硬编码                  |
| `toHaveURL(/.*admin\/dashboard/)` | 断言 URL 包含 admin/dashboard，自带自动等待 |
| `{ tag: ['@p0'] }`                | 标签标记优先级，`--grep "@p0"` 捞到         |

---

## `tests/regression/login.spec.ts`（P1 回归）

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

test.describe('登录-回归', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('登录 | 密码错误 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await loginPage.login(config.admin.username, 'wrong-password');

    // 错误断言
    await expect(page.getByText('用户名或密码错误')).toBeVisible();
    // 页面
    await expect(page).toHaveURL(/.*login/);
  });

  test('登录 | 用户名为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    await loginPage.loginButton.click();

    await expect(page.getByText('请输入用户名')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });

  test('登录 | 密码为空 | 提示必填', { tag: ['@p1'] }, async ({ page }) => {
    await loginPage.usernameInput.fill(config.admin.username);
    await loginPage.loginButton.click();

    await expect(page.getByText('请输入密码')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
```

| 代码                            | 作用                                           |
| ------------------------------- | ---------------------------------------------- |
| `'wrong-password'`              | 故意用错误密码，验证服务端拒绝                 |
| `getByText('用户名或密码错误')` | Toast 弹窗文字，直接用文本定位                 |
| `getByText('请输入用户名')`     | Ant Design Form 校验提示                       |
| `loginButton.click()` 跳过 fill | 空值场景不调 `login()`，直接点按钮触发表单校验 |
| 双重断言（提示 + URL）          | 既验证错误反馈可见，也验证没有意外跳转         |

---

## 用例对照表

|  编号  | 优先级 | 标签 | 标题                                 | 文件                     |
| :----: | :----: | ---- | ------------------------------------ | ------------------------ |
| TC-A01 |   P0   | @p0  | 登录 \| 正确账号密码 \| 跳转到首页   | smoke/login.spec.ts      |
| TC-A02 |   P0   | @p0  | 登录 \| 普通用户 \| 进入后台只读页面 | smoke/login.spec.ts      |
| TC-A03 |   P1   | @p1  | 登录 \| 密码错误 \| 提示错误信息     | regression/login.spec.ts |
| TC-A04 |   P1   | @p1  | 登录 \| 用户名为空 \| 提示必填       | regression/login.spec.ts |
| TC-A05 |   P1   | @p1  | 登录 \| 密码为空 \| 提示必填         | regression/login.spec.ts |

---

## 验证命令

```bash
# 冒烟
npm run test:smoke

# 回归
npm run test:regression

# 单文件
npx playwright test tests/smoke/login.spec.ts --headed
npx playwright test tests/regression/login.spec.ts --headed
```

---

## 登录态复用

每个用例 `beforeEach` 都走完整登录效率太低。Playwright 提供 `storageState` 机制：登录一次，保存浏览器状态（Cookie、localStorage），后续用例直接加载，跳过登录。

### `tests/auth.setup.ts`（新增）

```typescript
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

setup('管理员登录-保存状态', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.admin.username, config.admin.password);
  await expect(page).toHaveURL(/.*admin\/dashboard/);

  // 保存登录态到文件
  await page.context().storageState({ path: 'auth-admin.json' });
});

setup('普通用户登录-保存状态', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.user.username, config.user.password);
  await expect(page).toHaveURL(/.*admin\/dashboard/);

  await page.context().storageState({ path: 'auth-user.json' });
});
```

| 代码                     | 作用                                    |
| ------------------------ | --------------------------------------- |
| `test as setup`          | setup 项目专用，不计入普通用例数        |
| `storageState({ path })` | 保存 Cookie + localStorage 到 JSON 文件 |
| `auth-admin.json`        | 管理员登录态，`.gitignore` 已忽略       |

### `playwright.config.ts` projects 配置

```typescript
projects: [
  // ══ Setup：最先执行，生成登录状态文件 ══
  {
    name: 'setup',
    testMatch: /auth\.setup\.ts/,
  },

  // ══ 登录用例：走完整登录流程，不使用 storageState ══
  {
    name: 'chromium-login',
    testMatch: /login\.spec\.ts/,
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['setup'],                           // 等 setup 跑完
  },

  // ══ 管理员用例：自动加载管理员登录态，跳过登录步骤 ══
  {
    name: 'chromium-admin',
    testMatch: /smoke\/|regression\//,                 // 匹配 smoke/ 和 regression/ 下所有文件
    testIgnore: /login\.spec\.ts/,                     // 排除登录用例（由 chromium-login 跑）
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'auth-admin.json',                 // 从文件恢复登录态
    },
    dependencies: ['setup'],
  },
],
```

| 配置                      | 作用                                              |
| ------------------------- | ------------------------------------------------- |
| `dependencies: ['setup']` | 等 auth.setup.ts 跑完、状态文件生成后再执行       |
| `storageState`            | 加载状态文件，浏览器自动恢复 Cookie，无需手动登录 |
| `testIgnore`              | 防止 login.spec.ts 在 chromium-admin 里重复跑     |

### 执行流程

```
npx playwright test
    │
    ├─ [setup]             auth.setup.ts          → 登录→保存 auth-admin.json + auth-user.json
    │
    ├─ [chromium-login]    login.spec.ts          → 走完整登录流程
    └─ [chromium-admin]    smoke/*.spec.ts        → 加载 auth-admin.json，直接测业务
                           regression/*.spec.ts
```

> 业务用例（smoke/、regression/）的 `beforeEach` 中删除登录代码，storageState 已经登录好了。 `login.spec.ts` 仍走完整登录，不受影响。
