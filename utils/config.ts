/**
 * 环境配置中心
 * 统一从.env读取配置，提供类型安全访问
 * 使用：
 *    import {config} from '../utils/config'
 *    console.log(config.baseUrl);  // → https://testing.yychuiyan.com
 *    console.log(config.admin.username); // → 炊烟1号
 */

export const config = {
  // 环境标识
  baseUrl: process.env.BASE_URL || 'https://testing.yychuiyan.com',
  // 管理员账号
  admin: {
    username: process.env.ADMIN_USERNAME || '炊烟1号',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  // 普通用户账号
  user: {
    username: process.env.USER_USERNAME || '炊烟2号',
    password: process.env.USER_PASSWORD || 'user123',
  },
};
