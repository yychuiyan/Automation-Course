# 第2步：工具库 + 测试数据

---

## 新增依赖

```bash
npm install -D dotenv
```

---

## 配置文件

### `playwright.config.ts` 改动

顶部加一行，让 Playwright 启动时自动加载 `.env`：

```typescript
import 'dotenv/config'; // ← 新增
import { defineConfig, devices } from '@playwright/test';
// ... 其余不变
```

> 注意：`dotenv/config` 在 `playwright.config.ts` 加载，不在 `config.ts`。因为前者是 Playwright 入口，最先执行。

---

### `utils/config.ts`（新增）

```typescript
/**
 * 环境配置中心
 * 统一从 .env 读取配置，提供类型安全访问
 *
 * 使用：
 *   import { config } from '../utils/config';
 *   console.log(config.baseUrl);          // → http://localhost:5174
 *   console.log(config.admin.username);   // → 炊烟1号
 */

export const config = {
  // 被测应用地址
  baseUrl: process.env.BASE_URL || 'https://testing.yechuiyan.com',

  // 管理员账号（全部权限）
  admin: {
    username: process.env.ADMIN_USERNAME || '炊烟1号',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },

  // 普通用户账号（只读权限）
  user: {
    username: process.env.USER_USERNAME || '炊烟2号',
    password: process.env.USER_PASSWORD || 'user123',
  },
};
```

| 决策                             | 为什么                                                |
| -------------------------------- | ----------------------------------------------------- |
| 不写在 `playwright.config.ts` 里 | 配置文件只放 Playwright 框架配置，业务配置放独立模块  |
| 每个字段给默认值                 | `.env` 忘配也能跑，默认值就是 testing-online 演示账号 |
| 不读 `ENV` 变量                  | 环境切换直接改 `.env` 的 `BASE_URL`，不需要额外标识   |

---

### `utils/logger.ts`（新增）

```typescript
/**
 * 日志工具
 * 带时间戳 + 级别前缀，比 console.log 更能看出执行时序
 *
 * 使用：
 *   Logger.info('开始登录');
 *   Logger.error('登录失败', error);
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_RANK: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private level: LogLevel = 'DEBUG';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(msg: string, ...args: unknown[]): void {
    this.log('DEBUG', msg, args);
  }

  info(msg: string, ...args: unknown[]): void {
    this.log('INFO', msg, args);
  }

  warn(msg: string, ...args: unknown[]): void {
    this.log('WARN', msg, args);
  }

  error(msg: string, ...args: unknown[]): void {
    this.log('ERROR', msg, args);
  }

  private log(level: LogLevel, msg: string, args: unknown[]): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.level]) return;

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const prefix = `[${timestamp}] [${level}]`;
    const fullMsg = `${prefix} ${msg}`;

    if (level === 'ERROR') {
      console.error(fullMsg, ...args);
    } else if (level === 'WARN') {
      console.warn(fullMsg, ...args);
    } else {
      console.log(fullMsg, ...args);
    }
  }
}

export const logger = new Logger();
```

| 决策               | 为什么                                      |
| ------------------ | ------------------------------------------- |
| 默认 `DEBUG` 级别  | 开发阶段所有日志都看，CI 可改为 `INFO` 减噪 |
| `slice(0, 19)`     | 时间戳只到秒，不需要毫秒                    |
| 不依赖第三方日志库 | 测试框架能用就行，没必要引入 winston 之类   |

---

### `utils/data-generator.ts`（新增）

```typescript
/**
 * 数据生成器
 * 每个用例跑之前生成唯一数据，避免数据残留导致用例间互相影响
 *
 * 使用：
 *   const name = DataGenerator.username();     // → "test_a3fk"
 *   const email = DataGenerator.email();      // → "test_a3fk@example.com"
 *   const product = DataGenerator.productName(); // → "测试商品_b7d2"
 */

export class DataGenerator {
  /** 生成 4 位随机后缀，保证数据唯一 */
  private static suffix(): string {
    return Math.random().toString(36).substring(2, 6);
  }

  /** 测试用户名 */
  static username(): string {
    return `test_${this.suffix()}`;
  }

  /** 测试邮箱 */
  static email(): string {
    return `test_${this.suffix()}@example.com`;
  }

  /** 测试商品名 */
  static productName(): string {
    return `测试商品_${this.suffix()}`;
  }

  /** 随机手机号 */
  static mobile(): string {
    return `1${Math.floor(Math.random() * 10)}${String(Math.floor(Math.random() * 10000000000)).padStart(9, '0')}`;
  }
}
```

| 方法            | 示例输出                | 使用场景           |
| --------------- | ----------------------- | ------------------ |
| `username()`    | `test_a3fk`             | 新增用户、编辑用户 |
| `email()`       | `test_a3fk@example.com` | 注册、新增用户     |
| `productName()` | `测试商品_b7d2`         | 新增商品、编辑商品 |
| `mobile()`      | `13812345678`           | 用户表单填写       |

---

### `data/test-users.json`（新增）

```json
{
  "admin": {
    "username": "炊烟1号",
    "password": "admin123",
    "role": "管理员"
  },
  "user": {
    "username": "炊烟2号",
    "password": "user123",
    "role": "普通用户"
  }
}
```

| 为什么外置 JSON     | 说明                                                   |
| ------------------- | ------------------------------------------------------ |
| 改账号只改一处      | 多个用例文件 import 同一个 JSON                        |
| `resolveJsonModule` | tsconfig 已配好，`import` 有类型提示                   |
| 和 `config.ts` 并存 | `config.ts` 读环境变量（CI 注入），JSON 是静态数据兜底 |

---

### `.env` 内容

```bash
# 环境选择

# 开发环境
BASE_URL=http://localhost:5174
# 测试环境
# BASE_URL=https://test.yychuiyan.com
# 灰度
# BASE_URL=https://uat.yychuiyan.com
# 线上
# BASE_URL=https://testing.yechuiyan.com

# 管理员账号（全部权限）
ADMIN_USERNAME=炊烟1号
ADMIN_PASSWORD=admin123

# 普通用户账号（只读权限）
USER_USERNAME=炊烟2号
USER_PASSWORD=user123
```

---

## 加载链路

```
.env 文件
    │
    ▼  playwright.config.ts 顶部的 import 'dotenv/config'
    │
process.env
    │
    ▼  config.ts 读取
    │
config.admin.username   ← 测试文件用这个
config.baseUrl          ← 被 playwright.config.ts 的 use.baseURL 引用
```

---

## 运行方式

### 日常执行（配好的 npm scripts）

```bash
npm test                    # 全量（全部用例）
npm run test:smoke          # 只跑 P0
npm run test:regression     # 跑 P0+P1
npm run test:headed         # 有头模式，看浏览器操作
npm run test:ui             # 可视化模式
npm run test:debug          # 逐行调试
npm run report              # 打开上次跑的 HTML 报告
```

### 切环境

改 `.env` 注释，命令不变：

```bash
# 开发环境
BASE_URL=http://localhost:5174
# 测试环境
# BASE_URL=https://test.yychuiyan.com

npm test   # 自动读 .env 当前生效的 BASE_URL
```

### 单文件 / 单用例（临时命令，不需要配 scripts）

```bash
# 跑单个文件
npx playwright test tests/smoke/login.spec.ts

# 跑单个用例（按标题 grep）
npx playwright test -g "正确账号密码"

# 按标签组合
npx playwright test -g "@p0" -g "@auth"

# 只重跑上次失败的
npx playwright test --last-failed

# 有头模式跑单个文件
npx playwright test tests/smoke/login.spec.ts --headed

# 调试模式跑单个用例
npx playwright test -g "正确账号密码" --debug
```

### 实际场景

```
开发写用例时     → npm run test:headed   看浏览器跑
写完快速验证     → npm run test:smoke    30 秒出结果
改登录模块       → npx playwright test -g "@auth"
提交前           → npm test              全量
CI 门禁          → npm run test:smoke
```

---

## 没有前端源码时如何写定位器

### 方式一：浏览器开发者工具（最快）

F12 → Elements 面板，直接看 HTML 结构，找 `data-testid`、`id`、`placeholder` 等可用属性。

### 方式二：Playwright Codegen（录制）

```bash
npx playwright codegen https://testing.yychuiyan.com/login
```

浏览器打开后手动操作一遍，Codegen 自动生成定位器代码，抄过来即可。

### 方式三：Playwright Inspector（调试）

```bash
npx playwright test --debug
```

打开后点 Inspector 里的「探索」按钮，鼠标悬停元素直接看到推荐定位器，点击即可查看选择器。

---

> 如果现有的 `getByRole` / `getByLabel` 等内置定位器不稳定，最直接的解决方案是跟前端沟通加 `data-testid` —— 一两个属性换来自动化稳定，前端通常愿意配合。

---

## 完成后的目录

```
Automation-Course/
├── package.json
├── playwright.config.ts          ← 改过（顶部加 dotenv/config）
├── tsconfig.json
├── .gitignore
├── .env.example
├── .env
├── node_modules/
├── pages/                        ← 空
├── tests/
│   ├── smoke/
│   ├── regression/
│   └── edge/
├── utils/
│   ├── config.ts                 ← 新增
│   ├── logger.ts                 ← 新增
│   └── data-generator.ts         ← 新增
├── data/
│   └── test-users.json           ← 新增
└── fixtures/                     ← 空
```
