/**
 * SQL 格式化工具
 * 提供格式化 SQL 查询的功能
 */

export interface SqlFormatOptions {
  indent?: number;        // 缩进空格数
  uppercase?: boolean;    // 是否将关键字转为大写
  linesBetweenQueries?: number; // 查询之间的空行数
}

// SQL 关键字列表
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN',
  'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
  'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET',
  'DELETE', 'TRUNCATE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX', 'PROCEDURE', 'FUNCTION',
  'TRIGGER', 'DATABASE', 'SCHEMA',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'CONSTRAINT',
  'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'WITH', 'CTE',
  'LIMIT', 'OFFSET'
];

/**
 * 格式化 SQL 查询
 * @param sql 原始 SQL 查询
 * @param options 格式化选项
 * @returns 格式化后的 SQL
 */
export function formatSqlQuery(sql: string, options: SqlFormatOptions = {}): string {
  // 默认选项
  const indent = options.indent ?? 2;
  const uppercase = options.uppercase ?? true;
  const linesBetweenQueries = options.linesBetweenQueries ?? 1;
  
  // 简化 SQL (移除多余空格和注释)
  let formatted = simplifySQL(sql);
  
  // 转换关键字为大写（如果需要）
  if (uppercase) {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN', 'LEFT JOIN', 
      'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 
      'EXISTS', 'UNION', 'ALL', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 
      'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 
      'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA', 'GRANT', 'REVOKE', 'CASCADE', 'DISTINCT'
    ];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/ /g, '\\s+')}\\b`, 'gi');
      formatted = formatted.replace(regex, keyword);
    });
  }
  
  // 处理主要 SQL 子句的换行和缩进
  formatted = formatted
    .replace(/\s*SELECT\b/gi, '\nSELECT')
    .replace(/\s*FROM\b/gi, '\nFROM')
    .replace(/\s*WHERE\b/gi, '\nWHERE')
    .replace(/\s*(?:AND|OR)\b/gi, `\n${' '.repeat(indent)}$&`)
    .replace(/\s*GROUP\s+BY\b/gi, '\nGROUP BY')
    .replace(/\s*ORDER\s+BY\b/gi, '\nORDER BY')
    .replace(/\s*HAVING\b/gi, '\nHAVING')
    .replace(/\s*LIMIT\b/gi, '\nLIMIT')
    .replace(/\s*OFFSET\b/gi, '\nOFFSET')
    .replace(/\s*JOIN\b/gi, '\nJOIN')
    .replace(/\s*LEFT\s+JOIN\b/gi, '\nLEFT JOIN')
    .replace(/\s*RIGHT\s+JOIN\b/gi, '\nRIGHT JOIN')
    .replace(/\s*INNER\s+JOIN\b/gi, '\nINNER JOIN')
    .replace(/\s*OUTER\s+JOIN\b/gi, '\nOUTER JOIN')
    .replace(/\s*ON\b/gi, `\n${' '.repeat(indent)}ON`)
    .replace(/\s*INSERT\s+INTO\b/gi, '\nINSERT INTO')
    .replace(/\s*VALUES\b/gi, '\nVALUES')
    .replace(/\s*UPDATE\b/gi, '\nUPDATE')
    .replace(/\s*SET\b/gi, '\nSET')
    .replace(/\s*DELETE\s+FROM\b/gi, '\nDELETE FROM')
    .replace(/\s*CREATE\b/gi, '\nCREATE')
    .replace(/\s*ALTER\b/gi, '\nALTER')
    .replace(/\s*DROP\b/gi, '\nDROP')
    .replace(/\s*UNION\b/gi, '\n\nUNION\n');
  
  // 处理括号中的逗号，使列表更清晰
  formatted = formatted.replace(/\(([^)]+)\)/g, (match, p1) => {
    return '(' + p1.replace(/,\s*/g, ',\n' + ' '.repeat(indent)) + ')';
  });
  
  // 处理多个查询之间的间隔
  if (linesBetweenQueries > 0) {
    const lineBreaks = '\n'.repeat(linesBetweenQueries + 1);
    formatted = formatted.replace(/;/g, `;${lineBreaks}`);
  }
  
  return formatted.trim();
}

/**
 * 简化 SQL 查询，移除注释和多余空格
 * @param sql 原始 SQL
 * @returns 简化后的 SQL
 */
function simplifySQL(sql: string): string {
  // 移除行注释 (-- 之后的内容)
  let simplified = sql.replace(/--.*$/gm, '');
  
  // 移除块注释 (/* ... */)
  simplified = simplified.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 将多个空格替换为单个空格
  simplified = simplified.replace(/\s+/g, ' ');
  
  return simplified.trim();
}

/**
 * 检测 SQL 查询的类型
 * @param sql SQL 查询
 * @returns SQL 类型 (select, insert, update 等)
 */
export function detectSQLType(sql: string): string | null {
  // 简化 SQL 以便于识别第一个关键字
  const simplified = simplifySQL(sql).toUpperCase();
  
  // 常见的 SQL 命令类型
  const patterns = {
    'select': /^\s*SELECT\b/i,
    'insert': /^\s*INSERT\b/i,
    'update': /^\s*UPDATE\b/i,
    'delete': /^\s*DELETE\b/i,
    'create': /^\s*CREATE\b/i,
    'alter': /^\s*ALTER\b/i,
    'drop': /^\s*DROP\b/i,
    'grant': /^\s*GRANT\b/i,
    'revoke': /^\s*REVOKE\b/i,
    'use': /^\s*USE\b/i,
    'begin': /^\s*BEGIN\b/i,
    'commit': /^\s*COMMIT\b/i,
    'rollback': /^\s*ROLLBACK\b/i
  };
  
  // 检查 SQL 的第一个单词来确定类型
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(simplified)) {
      return type;
    }
  }
  
  return null;
} 