# 第4步：注册模块 P0+P1

---

## 产出文件

| 文件                                | 说明               |
| ----------------------------------- | ------------------ |
| `pages/RegisterPage.ts`             | 注册页 Page Object |
| `tests/smoke/register.spec.ts`      | 冒烟 P0，1 条      |
| `tests/regression/register.spec.ts` | 回归 P1，4 条      |

> 注册页为公开页面，无需登录态。

---

## `pages/RegisterPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 注册页面
 * URL: /register
 */
export class RegisterPage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly genderMale: Locator;
  readonly hobbyMusic: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly phoneInput: Locator;
  readonly agreeCheckbox: Locator;
  readonly submitBtn: Locator;

  constructor(public page: Page) {
    this.usernameInput = page.getByRole('textbox', { name: '用户名' });
    this.emailInput = page.getByRole('textbox', { name: '邮箱' });
    this.passwordInput = page.getByRole('textbox', { name: /密码/ }).first();
    this.confirmPasswordInput = page.getByRole('textbox', { name: '确认密码' });
    this.phoneInput = page.getByRole('textbox', { name: '手机号' });
    this.genderMale = page.getByRole('radio', { name: '男' });
    this.hobbyMusic = page.getByRole('checkbox', { name: '音乐' });
    this.agreeCheckbox = page.getByRole('checkbox', { name: /我已阅读并同意/ });
    this.submitBtn = page.getByRole('button', { name: '注 册' });
  }

  async goto() {
    await this.page.goto('/register');
  }

  // 注册
  async register(username: string, email: string, password: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.genderMale.click();
    await this.hobbyMusic.click();
    await this.agreeCheckbox.check();
    await this.submitBtn.click();
  }
}
```

| 代码                                                | 作用                                             |
| --------------------------------------------------- | ------------------------------------------------ |
| `getByRole('textbox', { name: /密码/ }).first()`    | 两个密码框 label 都含"密码"，`first()` 取第一个  |
| `getByRole('textbox', { name: '确认密码' })`        | 第二个密码框，label 唯一                         |
| `getByRole('radio', { name: '男' })`                | Radio 单选                                       |
| `getByRole('checkbox', { name: '音乐' })`           | Checkbox 多选爱好                                |
| `getByRole('checkbox', { name: /我已阅读并同意/ })` | 协议勾选框，文字较长用正则部分匹配               |
| `register()`                                        | 封装完整注册：填表 → 选性别/爱好 → 勾协议 → 提交 |

---

## `tests/smoke/register.spec.ts`（P0 冒烟）

```typescript
import { test, expect } from '@playwright/test';
import { RegisterPage } from '@/pages/RegisterPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('注册-冒烟', () => {
  let registerPage: RegisterPage;
  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('注册 | 填写完整信息 | 跳转登录页', { tag: ['@p0'] }, async ({ page }) => {
    await registerPage.register(DataGenerator.username(), DataGenerator.email(), 'test123456');

    // 模拟注册成功后跳转到登录页面
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('注册成功')).toBeVisible();
  });
});
```

| 代码         | 作用                        |
| ------------ | --------------------------- |
| `register()` | 一行完成完整注册            |
| 双重断言     | 跳转登录页 + Toast 提示成功 |

---

## `tests/regression/register.spec.ts`（P1 回归）

```typescript
import { test, expect } from '@playwright/test';
import { RegisterPage } from '@/pages/RegisterPage';
import { DataGenerator } from '@/utils/data-generator';

test.describe('注册-回归', () => {
  let registerPage: RegisterPage;
  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('注册 | 用户名为空 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.emailInput.fill('yycy@example.com');
    await registerPage.passwordInput.fill('test1234');
    await registerPage.confirmPasswordInput.fill('test1234');

    await registerPage.submitBtn.click();

    await expect(page.getByText('请输入用户名')).toBeVisible();
  });

  test('注册 | 邮箱格式错误 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.emailInput.fill('not-an-email');

    await expect(page.getByText('邮箱格式不正确')).toBeVisible();
  });

  test('注册 | 两次密码不一致 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.passwordInput.fill('test123');
    await registerPage.confirmPasswordInput.fill('different');

    await expect(page.getByText('两次密码输入不一致')).toBeVisible();
  });

  test('注册 | 用户协议未填项 | 提示错误信息', { tag: ['@p1'] }, async ({ page }) => {
    await registerPage.usernameInput.fill('test');
    await registerPage.emailInput.fill('yycy@example.com');
    await registerPage.passwordInput.fill('test1234');
    await registerPage.confirmPasswordInput.fill('test1234');

    await registerPage.submitBtn.click();

    await expect(page.getByText('请同意用户协议和隐私政策')).toBeVisible();
  });
});
```

| 代码                      | 作用                                   |
| ------------------------- | -------------------------------------- |
| 邮箱 / 密码不一致不点提交 | Ant Design 失焦即校验，fill 后自动触发 |
| 用户名 / 协议点提交       | 必填和协议校验需要 submit 触发         |
| 每个用例只测一个维度      | 单点验证，挂了知道哪个校验规则出问题   |

---

## 用例对照表

|  编号   | 优先级 | 标签 | 标题                                   | 文件                        |
| :-----: | :----: | ---- | -------------------------------------- | --------------------------- |
| TC-RG01 |   P0   | @p0  | 注册 \| 填写完整信息 \| 跳转登录页     | smoke/register.spec.ts      |
| TC-RG02 |   P1   | @p1  | 注册 \| 用户名为空 \| 提示错误信息     | regression/register.spec.ts |
| TC-RG03 |   P1   | @p1  | 注册 \| 邮箱格式错误 \| 提示错误信息   | regression/register.spec.ts |
| TC-RG04 |   P1   | @p1  | 注册 \| 两次密码不一致 \| 提示错误信息 | regression/register.spec.ts |
| TC-RG05 |   P1   | @p1  | 注册 \| 用户协议未填项 \| 提示错误信息 | regression/register.spec.ts |

---

## 验证命令

```bash
# 冒烟
npx playwright test tests/smoke/register.spec.ts --headed

# 回归
npx playwright test tests/regression/register.spec.ts --headed

# 按标签
npx playwright test -g "@p0"
npx playwright test -g "@p1"
```
