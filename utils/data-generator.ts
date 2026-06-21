/**
 * 数据生成器
 * 每个用户跑之前生成唯一数据，避免数据残留导致用例间相互影响
 *
 * 使用：
 *    const name=DataGenerator.username() // → "test_user_a3fk"
 *    const email=DataGenerator.email() // → "test_a3fk2m@example.com"
 */

export class DataGenerator {
  // 生成4位随机后缀，保证数据唯一
  private static suffix(): string {
    return Math.random().toString(36).substring(2, 6);
  }

  // 用户名
  static username(): string {
    return `test_${this.suffix()}`;
  }

  // 邮箱
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
