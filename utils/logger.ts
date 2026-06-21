/**
 * 日志工具
 * 时间戳+级别前缀
 * 使用：
 *    Logger.info('开始登录')
 *    Logger.error('登录失败',error)
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

    const timestamp = new Date().toISOString().replace('T', ' ');
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
