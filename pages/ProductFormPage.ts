import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 商品表单页（新增/编辑共用）
 * URL: /admin/products/new 或 /admin/products/:id
 */

export class ProductFormPage extends BasePage {
  readonly nameInput: Locator;
  readonly priceInput: Locator;
  readonly saveBtn: Locator;

  constructor(public page: Page) {
    super(page);
    this.nameInput = page.getByRole('textbox', { name: '商品名称' });
    this.priceInput = page.getByRole('spinbutton', { name: '价格' });
    this.saveBtn = page.getByRole('button', { name: '保存' });
  }
  async goto() {
    await this.navigate('/admin/products/new');
  }
  // 新增商品
  async create(name: string, price: string) {
    await this.nameInput.fill(name);
    await this.priceInput.fill(price);
    await this.saveBtn.click();
  }
  // 编辑页面
  async editName(newName: string) {
    await this.nameInput.clear(); // 确保旧内容清空
    await this.nameInput.fill(newName);
    await this.saveBtn.click();
  }
}
