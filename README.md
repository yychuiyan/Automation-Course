# Automation Course — Playwright 自动化测试

基于 Playwright + TypeScript 的 UI 自动化测试项目，测试目标为 [testing-online](https://testing.yychuiyan.com) 后台管理系统。

## 快速开始

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm test
```

## 常用命令

```bash
npm run test:smoke        # P0 冒烟（12 条）
npm run test:regression   # P0+P1 回归（27 条）
npm test                  # 全量（28 条）
npm run test:headed       # 有头模式
npm run test:ui           # 可视化模式
npm run test:debug        # 逐行调试
npm run report            # 打开 HTML 报告
npm run lint              # ESLint 代码检查
npm run format            # Prettier 格式化
```

## 目录结构

```
├── pages/                # Page Object（9 个页面 + BasePage）
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── UserListPage.ts
│   ├── UserFormPage.ts
│   ├── ProductListPage.ts
│   ├── ProductFormPage.ts
│   ├── OrderListPage.ts
│   ├── OrderDetailPage.ts
│   └── CartPage.ts
├── tests/
│   ├── auth.setup.ts     # 多角色登录态
│   ├── smoke/            # P0 冒烟（12 条）
│   ├── regression/       # P1 回归（15 条）
│   └── edge/             # P2 边界（1 条）
├── utils/                # 工具库
│   ├── config.ts
│   ├── logger.ts
│   └── data-generator.ts
├── data/                 # 测试数据
└── docs/                 # 搭建文档
```

## 用例统计

| 模块     |   P0   |   P1   |  P2   |  合计  |
| -------- | :----: | :----: | :---: | :----: |
| 登录     |   2    |   3    |   1   |   6    |
| 注册     |   1    |   4    |   —   |   5    |
| 用户管理 |   3    |   2    |   —   |   5    |
| 商品管理 |   3    |   3    |   —   |   6    |
| 订单管理 |   2    |   2    |   —   |   4    |
| 购物车   |   1    |   1    |   —   |   2    |
| **合计** | **12** | **15** | **1** | **28** |

## 标签体系

| 标签  | 含义       | 执行时机    |
| ----- | ---------- | ----------- |
| `@p0` | 核心主流程 | PR 门禁必跑 |
| `@p1` | 重要功能   | 每日回归    |
| `@p2` | 边界场景   | 发版前      |

## 执行策略

```
PR 提交  → npm run test:smoke       # P0 冒烟
每日凌晨 → npm run test:regression  # P0+P1 回归
发版前   → npm test                 # 全量
```

## 环境切换

修改 `.env` 中 `BASE_URL`：

```bash
# 开发环境
BASE_URL=http://localhost:5174
# 线上环境
# BASE_URL=https://testing.yechuiyan.com
```

## 技术栈

| 层       | 技术                     |
| -------- | ------------------------ |
| 测试框架 | Playwright + TypeScript  |
| 代码规范 | ESLint + Prettier        |
| CI/CD    | GitHub Actions / Jenkins |
