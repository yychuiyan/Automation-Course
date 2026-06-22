import 'dotenv/config';
import 'tsconfig-paths/register';
import { defineConfig, devices } from '@playwright/test';

// Allure 报告输出目录
process.env.ALLURE_RESULTS_DIR = 'reports/allure-results';

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

  // 报告器：HTML + Allure 双报告
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'reports/allure-results' }],
  ],

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

  // 浏览器配置
  projects: [
    /**
     * 登录状态
     */
    // 最先执行，生成登录状态文件
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 登录用例：走完整登录流程，不使用 storageState
    {
      name: 'chromium-login',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // 管理员用例：自动加载管理员登录态，skip 登录步骤
    {
      name: 'chromium-admin',
      // 匹配 smoke/ 和 regression/ 下所有文件
      testMatch: /smoke\/|regression\//,
      testIgnore: /login\.spec\.ts/, // ← 登录用例由 chromium-login 单独跑
      use: {
        ...devices['Desktop Chrome'],
        // 从文件恢复登录态
        storageState: 'auth-admin.json',
      },
      // 等 setup 跑完才执行
      dependencies: ['setup'],
    },
    // edge 边界用例
    {
      name: 'chromium-edge',
      testMatch: /edge\//,
      testIgnore: /login\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-admin.json',
      },
      dependencies: ['setup'],
    },
    // edge 登录边界：不走 storageState
    {
      name: 'chromium-edge-login',
      testMatch: /edge\/login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    /**
     * 浏览器
     */
    // { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
