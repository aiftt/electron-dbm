/**
 * SQL 格式化服务
 * 提供 SQL 查询语句的格式化和美化功能
 */

// 这个服务将使用第三方库来完成格式化
// 实际应用中可以使用如 sql-formatter 等库
// 这里实现一个简单版本进行演示

import { format } from 'sql-formatter';

/**
 * SQL 格式化选项
 */
interface FormatOptions {
  uppercase?: boolean;
  indentSize?: number;
}

/**
 * SQL 格式化服务类
 */
export class SqlFormatterService {
  /**
   * 格式化 SQL 查询语句
   * @param sql 原始 SQL 查询语句
   * @param options 格式化选项
   * @returns 格式化后的 SQL 查询语句
   */
  formatSql(sql: string, options: FormatOptions = {}): string {
    const {
      uppercase = true,
      indentSize = 2
    } = options;

    try {
      return format(sql, {
        language: 'mysql', // 可以根据需要改为 postgresql, tsql, sqlite 等
        keywordCase: uppercase ? 'upper' : 'preserve',
        tabWidth: indentSize,
        linesBetweenQueries: 2
      });
    } catch (error) {
      console.error('SQL 格式化失败:', error);
      return sql; // 如果格式化失败，返回原始 SQL
    }
  }
}

// 创建并导出格式化器实例
export const sqlFormatter = new SqlFormatterService(); 