/**
 * SQL 格式化工具
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
 * 格式化 SQL 查询语句
 * @param sql 原始 SQL 查询
 * @param options 格式化选项
 * @returns 格式化后的 SQL
 */
export function formatSqlQuery(sql: string, options: SqlFormatOptions = {}): string {
  // 默认选项
  const indent = options.indent ?? 2;
  const uppercase = options.uppercase ?? true;
  const linesBetweenQueries = options.linesBetweenQueries ?? 2;
  
  // 简化 SQL (移除多余空格和注释)
  let simplified = simplifySQL(sql);
  
  // 转换关键字为大写
  if (uppercase) {
    SQL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/ /g, '\\s+')}\\b`, 'gi');
      simplified = simplified.replace(regex, keyword);
    });
  }
  
  // 在主要关键字前添加换行和缩进
  const mainKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT'];
  mainKeywords.forEach(keyword => {
    if (uppercase) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      simplified = simplified.replace(regex, `\n${keyword}`);
    } else {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      simplified = simplified.replace(regex, match => `\n${match}`);
    }
  });
  
  // 处理JOIN
  const joinKeywords = ['JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN'];
  joinKeywords.forEach(keyword => {
    if (uppercase) {
      const regex = new RegExp(`\\b${keyword.replace(/ /g, '\\s+')}\\b`, 'g');
      simplified = simplified.replace(regex, `\n${keyword}`);
    } else {
      const regex = new RegExp(`\\b${keyword.replace(/ /g, '\\s+')}\\b`, 'gi');
      simplified = simplified.replace(regex, match => `\n${match}`);
    }
  });
  
  // 处理逗号后添加换行
  simplified = simplified.replace(/,\s*/g, ',\n');
  
  // 处理缩进
  const lines = simplified.split('\n');
  let formattedLines = [];
  let indentLevel = 0;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // 检查是否为主要关键字开头
    const isMainKeyword = mainKeywords.some(keyword => 
      line.toUpperCase().startsWith(keyword)
    );
    
    // 降低缩进级别
    if (isMainKeyword) {
      indentLevel = 1;  // 主关键字用固定的一级缩进
    }
    
    // 添加缩进
    const indentation = ' '.repeat(indentLevel * indent);
    formattedLines.push(indentation + line);
    
    // 如果是 WHERE/HAVING 之后，增加缩进用于条件语句
    if (line.toUpperCase().startsWith('WHERE') || line.toUpperCase().startsWith('HAVING')) {
      indentLevel++;
    }
  }
  
  // 处理多个查询语句
  const queries = formattedLines.join('\n').split(';');
  if (queries[queries.length - 1].trim() === '') {
    queries.pop();  // 移除最后一个空查询
  }
  
  const formattedQueries = queries.map(q => q.trim() + ';');
  
  return formattedQueries.join('\n'.repeat(linesBetweenQueries + 1));
}

/**
 * 简化 SQL，去除注释和多余空格
 * @param sql 原始 SQL
 * @returns 简化后的 SQL
 */
function simplifySQL(sql: string): string {
  // 移除多行注释 /* ... */
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 移除单行注释 -- ...
  result = result.replace(/--.*$/gm, '');
  
  // 连续空白替换为单个空格
  result = result.replace(/\s+/g, ' ');
  
  // 移除不必要的空白
  result = result.replace(/\s*([(),;])\s*/g, '$1');
  result = result.replace(/\s+([=<>])\s+/g, ' $1 ');
  
  return result.trim();
}

/**
 * 检测 SQL 类型
 * @param sql SQL 查询语句
 * @returns SQL 类型 (select|insert|update|delete|create|alter|drop|other)
 */
export function detectSQLType(sql: string): string {
  // 去除注释和空白后提取第一个关键字
  const simplified = simplifySQL(sql);
  const firstWord = simplified.split(' ')[0].toUpperCase();
  
  switch (firstWord) {
    case 'SELECT':
      return 'select';
    case 'INSERT':
      return 'insert';
    case 'UPDATE':
      return 'update';
    case 'DELETE':
      return 'delete';
    case 'CREATE':
      return 'create';
    case 'ALTER':
      return 'alter';
    case 'DROP':
      return 'drop';
    default:
      return 'other';
  }
} 