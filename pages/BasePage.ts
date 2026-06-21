import { Page } from '@playwright/test';

/**
 * 页面对象基类
 * Page类继承BasePage，省去重复声明this.page
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
