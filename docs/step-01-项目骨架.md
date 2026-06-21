# 第1步：项目骨架

---

## 操作步骤

```bash
cd /Volumes/yycy/GitHub/PlaywrightAutomation/Automation-Course

# 1. Playwright 脚手架初始化（TypeScript 选 Yes，其余默认）
npm init playwright@latest

# 2. 创建分层目录
mkdir -p tests/smoke tests/regression tests/edge
mkdir -p pages utils data fixtures

# 3. 删掉示例文件
rm tests/example.spec.ts

```

> 不需要手动创建 `reports/playwright-report/`，Playwright 跑测试时会自动生成。

---

## 配置文件

### `package.json`

在脚手架生成的基础上，精简 scripts：

```json
{
  "scripts": {
    "test": "npx playwright test",
    "test:smoke": "npx playwright test --grep '@p0'",
    "test:regression": "npx playwright test --grep '@p0|@p1'",
    "test:headed": "npx playwright test --headed",
    "test:ui": "npx playwright test --ui",
    "test:debug": "npx playwright test --debug",
    "report": "npx playwright show-report"
  }
}
```

| script            | 作用                         |
| ----------------- | ---------------------------- |
| `test`            | 全量跑                       |
| `test:smoke`      | 只跑 P0，标签 grep           |
| `test:regression` | 跑 P0+P1，标签 grep          |
| `test:headed`     | 有头模式，肉眼看到浏览器操作 |
| `test:ui`         | Playwright 可视化模式        |
| `test:debug`      | 逐行调试                     |
| `report`          | 打开 HTML 报告               |

devDependencies 保持脚手架安装的即可。

---

### `playwright.config.ts`

覆盖脚手架生成的，带完整注释：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试文件目录，用例统一放在 tests/ 下
  testDir: './tests',

  // 单个用例最大执行时间，超过 30s 判定失败
  timeout: 30 * 1000,

  // 单个断言超时，比如等 Toast 出现、等列表渲染
  expect: { timeout: 10 * 1000 },

  // CI 环境失败重试 2 次（容忍网络抖动），本地不重试（即时反馈）
  retries: process.env.CI ? 2 : 0,

  // 只识别 .spec.ts 后缀的文件作为测试用例
  testMatch: '**/*.spec.ts',

  // 用例间没有依赖，全部文件并行跑，速度最快
  fullyParallel: true,

  // CI 上禁止 test.only，防止调试代码被合入
  forbidOnly: !!process.env.CI,

  // 报告器：HTML 报告输出到 reports/，跑完不自动打开浏览器
  reporter: [['html', { outputFolder: 'reports/playwright-report', open: 'never' }]],

  // 全局行为，所有用例共享
  use: {
    // 被测应用根地址，用例里写相对路径如 /login，切环境只改环境变量
    baseURL: process.env.BASE_URL || 'https://testing.yychuiyan.com',

    // 单次点击/输入等操作超时，比 expect 宽松（有些操作慢但合理）
    actionTimeout: 15 * 1000,

    // 只在失败时截图，通过时省空间
    screenshot: 'only-on-failure',

    // 失败时保留 trace（可回放每一步操作），通过时不保留
    trace: 'retain-on-failure',

    // 失败时保留录像，通过时不保留
    video: 'retain-on-failure',

    // 浏览器语言设为中文，跟被测系统一致
    locale: 'zh-CN',
  },

  // 浏览器配置，第1步单 chromium，多角色多浏览器第8步再加
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

### `tsconfig.json`（新增）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": [
    "tests/**/*.ts",
    "pages/**/*.ts",
    "utils/**/*.ts",
    "fixtures/**/*.ts",
    "data/**/*.json",
    "playwright.config.ts"
  ],
  "exclude": ["node_modules", "dist", "reports", "test-results"]
}
```

| 配置                      | 为什么                                              |
| ------------------------- | --------------------------------------------------- |
| `strict: true`            | 严格类型检查，拼写错误、空值问题编译阶段就暴露      |
| `resolveJsonModule: true` | 允许 `import` JSON 文件，后续测试数据外置时直接导入 |
| `skipLibCheck: true`      | 跳过 node_modules 类型检查，加快编译                |

---

### `.env.example`（新增）

提交 Git 的模板，不含真实密码（本项目的演示账号本就是公开的）：

```bash
# 测试目标地址
BASE_URL=https://testing.yychuiyan.com

# 管理员账号（全部权限）
ADMIN_USERNAME=炊烟1号
ADMIN_PASSWORD=admin123

# 普通用户账号（只读权限）
USER_USERNAME=炊烟2号
USER_PASSWORD=user123
```

---

### `.env`（新增，不提交 Git）

使用前从 `.env.example` 复制：

```bash
cp .env.example .env
```

---

### `.gitignore`

在脚手架生成的基础上，末尾追加两行：

```
.env
auth-*.json
```

| 追加项        | 原因                                       |
| ------------- | ------------------------------------------ |
| `.env`        | 含密码，不提交                             |
| `auth-*.json` | 多角色登录态文件，每次运行重新生成，不提交 |

---

## 完成后的目录

```
Automation-Course/
├── package.json
├── playwright.config.ts
├── tsconfig.json               ← 新增
├── .gitignore                  ← 改过
├── .env.example                ← 新增
├── .env                        ← 新增，不提交
├── node_modules/
├── pages/                      ← 空
├── tests/
│   ├── smoke/                  ← 空
│   ├── regression/             ← 空
│   └── edge/                   ← 空
├── data/                       ← 空
├── utils/                      ← 空
└── fixtures/                   ← 空
```
