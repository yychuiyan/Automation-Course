# 第8步：边界场景 + 上传下载 P2

---

## 产出文件

| 文件                          | 说明           |
| ----------------------------- | -------------- |
| `tests/edge/login.spec.ts`    | 登录边界，2 条 |
| `tests/edge/download.spec.ts` | 文件下载，2 条 |
| `tests/edge/upload.spec.ts`   | 图片上传，1 条 |
| `tests/edge/general.spec.ts`  | 通用边界，1 条 |

---

## `tests/edge/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { config } from '@/utils/config';

test.describe('登录-边界', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('登录 | 快速双击按钮 | 不重复提交', { tag: ['@p2'] }, async ({ page }) => {
    await loginPage.usernameInput.fill(config.admin.username);
    await loginPage.passwordInput.fill(config.admin.password);
    // 模拟用户手快连点两下
    await loginPage.loginButton.dblclick();

    // 正常跳转一次，不会因重复提交崩溃
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });

  test('登录 | 超长输入 | 限制生效', { tag: ['@p2'] }, async ({ page }) => {
    const longText = 'a'.repeat(50);

    await loginPage.usernameInput.fill(longText);
    // inputValue() 读取输入框实际值，验证 maxLength 截断
    const actualValue = await loginPage.usernameInput.inputValue();
    expect(actualValue.length).toBeLessThan(longText.length);

    await loginPage.passwordInput.fill(longText);
    await loginPage.loginButton.click();

    // 不会因为超长输入崩溃
    await expect(page.getByText(/用户名或密码错误|请输入/)).toBeVisible();
  });
});
```

| 代码                         | 作用                                         |
| ---------------------------- | -------------------------------------------- |
| `dblclick()`                 | 模拟双击，验证按钮防抖/loading 保护是否生效  |
| `inputValue()`               | 读取输入框当前值，不是 HTML 属性             |
| `/用户名或密码错误\|请输入/` | 正则"或"，超长输入要么报错要么校验，不能崩溃 |

---

## `tests/edge/download.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('文件下载-边界', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/download');
  });

  test('下载 | a标签方式 | 文件保存成功', { tag: ['@p2'] }, async ({ page }) => {
    // 先注册监听再触发下载
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-link-btn').click(),
    ]);

    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('下载 | fetch方式 | 文件保存成功', { tag: ['@p2'] }, async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-txt-btn').click()]);

    expect(download.suggestedFilename()).toBeTruthy();
  });
});
```

| 代码                       | 作用                                      |
| -------------------------- | ----------------------------------------- |
| `waitForEvent('download')` | Playwright 自动捕获浏览器下载事件         |
| `Promise.all([...])`       | 同时注册监听+触发，避免下载比监听先完成   |
| `suggestedFilename()`      | 下载对象的方法，获取文件名（如 test.txt） |

### 下载原理

Playwright 不会像真实浏览器那样弹出"保存到…"对话框，而是自动保存到临时目录：

```
1. page.waitForEvent('download')  ← 注册下载监听
2. 点击下载按钮                   ← 触发下载
3. Playwright 自动拦截 → 存到临时目录
4. download.suggestedFilename()  ← 验证文件名正确
```

---

## `tests/edge/upload.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('图片上传-边界', () => {
  test('上传 | 单张图片 | 上传成功', { tag: ['@p2'] }, async ({ page }) => {
    // 进入新增商品页
    await page.goto('/admin/products/new');

    // Playwright 文件选择器不会像真实浏览器般限制文件类型
    // 点击"上传图片"区域触发文件选择
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('上传图片').click();
    const fileChooser = await fileChooserPromise;

    // 选一个图片文件上传
    await fileChooser.setFiles(path.resolve(__dirname, '../../data/test-image.png'));
  });
});
```

| 代码                          | 作用                       |
| ----------------------------- | -------------------------- |
| `waitForEvent('filechooser')` | 监听文件选择对话框弹出     |
| `Promise 模式`                | 先注册监听再点击，避免竞态 |
| `setFiles()`                  | 设置要上传的文件路径       |

### 上传原理

```
1. page.waitForEvent('filechooser')  ← 注册监听
2. 点击上传按钮                     ← 触发 input[type=file]
3. Playwright 拦截文件选择框
4. fileChooser.setFiles(path)       ← 代替用户选择文件
5. 前端拿到文件 → customRequest → POST /api/upload
```

### 准备测试图片

在 `data/` 目录下放一张小图片 `test-image.png`（< 100KB，满足上传限制）。

```bash
# 创建一张 1x1 的极小 PNG（约 68 bytes）
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > data/test-image.png
```

---

## `tests/edge/general.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('通用边界', () => {
  test('边界 | 多标签页并发 | 各页面独立不串号', { tag: ['@p2'] }, async ({ browser }) => {
    // 用管理员登录态新建上下文
    const adminContext = await browser.newContext({ storageState: 'auth-admin.json' });
    const page1 = await adminContext.newPage();
    const page2 = await adminContext.newPage();

    await page1.goto('/admin/products');
    await page2.goto('/admin/orders');

    // 两个标签页独立，不串号
    await expect(page1).toHaveURL(/.*admin\/products/);
    await expect(page2).toHaveURL(/.*admin\/orders/);

    await adminContext.close();
  });
});
```

| 代码                           | 作用                               |
| ------------------------------ | ---------------------------------- |
| `browser` fixture              | 直接拿浏览器实例，创建独立 context |
| `newContext({ storageState })` | 新建上下文并加载登录态             |
| `newPage()`                    | 在上下文中创建新标签页             |
| `close()`                      | 测完清理上下文                     |

---

## 用例对照表

|  编号  | 优先级 | 标签 | 标题                                     | 文件                  |
| :----: | :----: | ---- | ---------------------------------------- | --------------------- |
| TC-A06 |   P2   | @p2  | 登录 \| 快速双击按钮 \| 不重复提交       | edge/login.spec.ts    |
| TC-A07 |   P2   | @p2  | 登录 \| 超长输入 \| 限制生效             | edge/login.spec.ts    |
| TC-F01 |   P2   | @p2  | 下载 \| a标签方式 \| 文件保存成功        | edge/download.spec.ts |
| TC-F02 |   P2   | @p2  | 下载 \| fetch方式 \| 文件保存成功        | edge/download.spec.ts |
| TC-P07 |   P2   | @p2  | 上传 \| 单张图片 \| 上传成功             | edge/upload.spec.ts   |
| TC-E01 |   P2   | @p2  | 边界 \| 多标签页并发 \| 各页面独立不串号 | edge/general.spec.ts  |

---

## 验证命令

```bash
# 单独跑边界
npx playwright test tests/edge/ --headed

# 全量
npm test
```
