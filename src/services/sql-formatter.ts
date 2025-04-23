/**
 * SQL 格式化服务
 * 提供 SQL 查询语句的格式化和美化功能
 */

// 这个服务将使用第三方库来完成格式化
// 实际应用中可以使用如 sql-formatter 等库
// 这里实现一个简单版本进行演示

/**
 * SQL 格式化选项
 */
export interface SqlFormatOptions {
  uppercase?: boolean;       // 是否将关键字转为大写
  indent?: string;           // 缩进字符，默认为两个空格
  maxLineLength?: number;    // 每行最大长度
}

/**
 * 默认格式化选项
 */
const defaultOptions: SqlFormatOptions = {
  uppercase: true,
  indent: '  ',
  maxLineLength: 80
};

/**
 * SQL 关键字列表
 */
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'TABLE', 'VIEW', 'INDEX', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'DATABASE', 'SCHEMA',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS', 'NATURAL',
  'ORDER', 'GROUP', 'BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'ON', 'AND', 'OR', 'NOT',
  'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'TRUE', 'FALSE', 'ASC', 'DESC',
  'DISTINCT', 'UNION', 'ALL', 'INTO', 'VALUES', 'SET', 'BEGIN', 'END', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'WITH'
];

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
  formatSql(sql: string, options?: Partial<SqlFormatOptions>): string {
    // 合并选项
    const opts = { ...defaultOptions, ...options };
    
    // 清理输入
    let cleaned = sql.trim();
    if (!cleaned) return '';
    
    // 关键字转换为大写（如果需要）
    if (opts.uppercase) {
      // 创建正则表达式来匹配关键字（确保只匹配完整的单词）
      const keywordRegex = new RegExp(`\\b(${SQL_KEYWORDS.join('|')})\\b`, 'gi');
      cleaned = cleaned.replace(keywordRegex, (match) => match.toUpperCase());
    }
    
    // 基本格式化：在主要关键字前添加换行和缩进
    const mainKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
    let formatted = cleaned;
    
    // 用空格标准化分隔符
    formatted = formatted.replace(/\s*,\s*/g, ', ');
    formatted = formatted.replace(/\(\s+/g, '(');
    formatted = formatted.replace(/\s+\)/g, ')');
    
    // 在关键词前添加换行
    mainKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    // 处理JOIN关键字
    const joinTypes = ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN'];
    joinTypes.forEach(joinType => {
      const regex = new RegExp(`\\b${joinType}\\b`, 'g');
      formatted = formatted.replace(regex, `\n${opts.indent}${joinType}`);
    });
    
    // 处理AND和OR操作符
    formatted = formatted.replace(/\b(AND|OR)\b/g, `\n${opts.indent}$1`);
    
    // 处理逗号后跟列名的情况（用于SELECT语句中的列）
    formatted = formatted.replace(/,\s*([^,\s]+)/g, (match, p1) => {
      // 如果在FROM前面，那么是SELECT的列
      if (formatted.indexOf('\nFROM') > formatted.indexOf(match)) {
        return `,\n${opts.indent}${p1}`;
      }
      return match;
    });
    
    // 移除多余的空行
    formatted = formatted.replace(/\n\s*\n/g, '\n');
    
    // 确保以换行符开头
    if (!formatted.startsWith('\n')) {
      formatted = '\n' + formatted;
    }
    
    // 移除第一个换行符以获得更好的输出
    return formatted.substring(1);
  }
}

// 创建并导出格式化器实例
export const sqlFormatter = new SqlFormatterService(); 