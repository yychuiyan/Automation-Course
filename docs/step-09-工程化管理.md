# 第9步：工程化管理

---

---

## 一、ESLint 代码检查

### 安装

```bash
npm install -D eslint @eslint/js typescript-eslint
```

### `eslint.config.mjs`（新增）

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'reports/', 'test-results/', 'playwright-report/'],
  },
);
```

| 规则                   | 效果                         |
| ---------------------- | ---------------------------- |
| `no-explicit-any: off` | 允许 `any` 类型              |
| `no-unused-vars: warn` | 未使用变量警告，`_` 开头忽略 |

### `package.json` scripts

```json
{
  "lint": "eslint tests/ pages/ utils/",
  "lint:fix": "eslint tests/ pages/ utils/ --fix"
}
```

---

## 二、Prettier 代码格式化

### 安装

```bash
npm install -D prettier
```

### `.prettierrc`（新增）

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2
}
```

### `.prettierignore`（新增）

```
node_modules/
dist/
reports/
test-results/
playwright-report/
auth-*.json
.env
```

### `package.json` scripts

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

---

## 三、Git 提交规范

### 安装

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

### `commitlint.config.mjs`（新增）

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档
        'style', // 代码格式
        'refactor', // 重构
        'perf', // 性能优化
        'test', // 增加测试
        'chore', // 构建/工具
        'revert', // 回退
        'build', // 打包
      ],
    ],
    'subject-case': [0],
  },
};
```

### 初始化 husky

```bash
npx husky init
```

### `.husky/pre-commit` — 提交前自动格式检查

```bash
npx lint-staged
```

### `.husky/commit-msg` — 提交时校验信息格式

```bash
npx --no -- commitlint --edit $1
```

### `package.json` 追加

```json
{
  "lint-staged": {
    "*.{ts,json,md,mjs,yaml}": ["prettier --write", "eslint --fix"]
  }
}
```

### `.gitignore` 追加

```
.husky/_
```

### 提交流程

```
git add .
git commit -m "feat: 新增用户管理模块"
    │
    ▼  .husky/pre-commit → npx lint-staged（格式 + lint）
    ▼  .husky/commit-msg → commitlint 校验格式
    │
    ├─ "feat: xxx"   ✅
    ├─ "fix: xxx"    ✅
    └─ "随便写"      ❌ 拦截
```

### 提交格式

```
feat: 新增用户管理模块
fix: 修复商品筛选 beforeCount = 0
docs: 更新 README
```

## 四、CI/CD

### GitHub Actions `.github/workflows/playwright.yml`

```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npx playwright install chromium --with-deps

      - name: Format check
        run: npm run format:check

      - name: Lint
        run: npm run lint

      - name: Smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          USER_USERNAME: ${{ secrets.USER_USERNAME }}
          USER_PASSWORD: ${{ secrets.USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: reports/playwright-report/
```

### Jenkins `Jenkinsfile`

```groovy
pipeline {
  agent any

  environment {
    BASE_URL        = credentials('testing-base-url')
    ADMIN_USERNAME  = credentials('testing-admin-username')
    ADMIN_PASSWORD  = credentials('testing-admin-password')
    USER_USERNAME   = credentials('testing-user-username')
    USER_PASSWORD   = credentials('testing-user-password')
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install chromium --with-deps'
      }
    }
    stage('Smoke') {
      steps { sh 'npm run test:smoke' }
      post {
        failure {
          emailext subject: "[冒烟失败] ${env.JOB_NAME}", body: env.BUILD_URL, to: 'dev-team@company.com'
        }
      }
    }
    stage('Regression') {
      steps { sh 'npm run test:regression' }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/playwright-report/**', allowEmptyArchive: true
    }
  }
}
```

### 执行策略

```
PR 提交  → 冒烟 P0      ← 5 分钟内
每日凌晨 → 回归 P0+P1   ← 20 分钟内
发版前   → 全量 npm test
```

---

## 五、BasePage 改造

### `pages/BasePage.ts`（新增）

```typescript
import { Page } from '@playwright/test';

/**
 * 页面对象基类
 * Page 类继承 BasePage，省去重复声明 this.page
 */
export class BasePage {
  constructor(protected page: Page) {}

  // 导航到指定路径，等网络静默后继续
  async navigate(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  // 等表格数据加载完成（loading 消失 + 第一行可见）
  async waitForTableLoaded() {
    await this.page
      .locator('.ant-spin-spinning')
      .first()
      .waitFor({ state: 'hidden' })
      .catch(() => {});
    await this.page
      .locator('.ant-table-row')
      .first()
      .waitFor({ state: 'visible' })
      .catch(() => {});
  }
}
```

| 方法                   | 作用                                     | 场景                       |
| ---------------------- | ---------------------------------------- | -------------------------- |
| `navigate(url)`        | goto + `waitForLoadState('networkidle')` | 所有页面导航统一入口       |
| `waitForTableLoaded()` | 等 loading 消失 + 表格第一行出现         | 列表页数据加载完成后再断言 |

### Page 类改造

每个 Page 类改两处：`extends BasePage` + `super(page)`，`this.page.goto()` 替换为 `this.navigate()`。9 个 Page 类全部完成。

### 改造好处

1. **消除重复** — 9 个 `constructor(public page: Page)` 收敛为父类一行
2. **解决 beforeCount = 0** — `navigate()` 自动等网络静默，批量并行不再读到空表格
3. **统一导航入口** — 后续加全局逻辑（日志、超时）只改 BasePage
4. **`waitForTableLoaded`** — 统一处理 Ant Design 表格加载态

## 六、Fixture 改造

Playwright `test.extend` 注入 Page 对象，省去用例中手动 `new`。当前项目规模暂不需要，Page 类和用例数量超过 15 个文件后再考虑。

## 七、README 项目文档（待写）

项目概览、快速开始、目录结构、常用命令、执行策略。

---

## 八、待办
