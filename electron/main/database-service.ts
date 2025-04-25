/**
 * 数据库服务 - Electron 主进程
 * 处理数据库连接和查询操作
 */

import { ipcMain } from 'electron';
import mysql from 'mysql2/promise';
import { Client as PgClient } from 'pg';
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

// 数据库连接配置接口
interface DbConnection {
  id: number;
  name: string;
  type: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  filename?: string;
  useSSL?: boolean;
  group?: string;
}

// 活动连接管理
interface ActiveConnection {
  mysql?: mysql.Connection;
  postgresql?: PgClient;
  sqlite?: BetterSqlite3.Database;
  config: DbConnection;
  timestamp: number;
}

// 活动连接缓存
const activeConnections: Map<number, ActiveConnection> = new Map();

// 连接超时时间 (30分钟)
const CONNECTION_TIMEOUT = 30 * 60 * 1000;

/**
 * 初始化数据库服务
 */
export function initDatabaseService() {
  // 定期清理非活动连接
  setInterval(() => cleanupInactiveConnections(), 5 * 60 * 1000);

  // 测试数据库连接
  ipcMain.handle('db:test-connection', async (_, connection: DbConnection) => {
    try {
      return await testConnection(connection);
    } catch (error) {
      console.error('测试连接失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // 连接到数据库
  ipcMain.handle('db:connect', async (_, connection: DbConnection) => {
    try {
      // 先尝试关闭可能存在的连接
      await closeConnection(connection.id);
      
      // 测试连接
      const testResult = await testConnection(connection);
      if (!testResult.success) {
        return testResult;
      }
      
      // 创建连接
      await createConnection(connection);
      
      return { success: true, message: '连接成功' };
    } catch (error) {
      console.error('连接数据库失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // 断开数据库连接
  ipcMain.handle('db:disconnect', async (_, connectionId: number) => {
    try {
      await closeConnection(connectionId);
      return { success: true };
    } catch (error) {
      console.error('断开连接失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // 获取数据库对象
  ipcMain.handle('db:get-objects', async (_, { connectionId, type }) => {
    try {
      return await getDatabaseObjects(connectionId, type);
    } catch (error) {
      console.error('获取数据库对象失败:', error);
      throw error;
    }
  });

  // 获取表列信息
  ipcMain.handle('db:get-table-columns', async (_, { connectionId, table, schema }) => {
    try {
      return await getTableColumns(connectionId, table, schema);
    } catch (error) {
      console.error('获取表列信息失败:', error);
      throw error;
    }
  });

  // 执行SQL查询
  ipcMain.handle('db:execute-query', async (_, { connectionId, sql, params }) => {
    try {
      return await executeQuery(connectionId, sql, params);
    } catch (error) {
      console.error('执行查询失败:', error);
      return {
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // 获取存储过程定义
  ipcMain.handle('db:get-procedure-definition', async (_, { connectionId, procedure, schema }) => {
    try {
      return await getProcedureDefinition(connectionId, procedure, schema);
    } catch (error) {
      console.error('获取存储过程定义失败:', error);
      throw error;
    }
  });

  // 获取数据库列表
  ipcMain.handle('db:get-databases', async (_, { connectionId }) => {
    try {
      return await getDatabases(connectionId);
    } catch (error) {
      console.error('获取数据库列表失败:', error);
      throw error;
    }
  });

  // 切换数据库
  ipcMain.handle('db:change-database', async (_, { connectionId, database }) => {
    try {
      return await changeDatabase(connectionId, database);
    } catch (error) {
      console.error('切换数据库失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
}

/**
 * 清理不活动的连接
 */
function cleanupInactiveConnections(): void {
  const now = Date.now();
  // 修复 Map 迭代语法
  Array.from(activeConnections.entries()).forEach(([id, conn]) => {
    if (now - conn.timestamp > CONNECTION_TIMEOUT) {
      closeConnection(id).catch(err => {
        console.error(`清理连接 ${id} 失败:`, err);
      });
    }
  });
}

/**
 * 关闭特定连接
 */
async function closeConnection(connectionId: number): Promise<void> {
  const conn = activeConnections.get(connectionId);
  if (!conn) return;

  try {
    if (conn.mysql) {
      await conn.mysql.end();
    }
    if (conn.postgresql) {
      await conn.postgresql.end();
    }
    if (conn.sqlite) {
      conn.sqlite.close();
    }
  } catch (err) {
    console.error('关闭连接时出错:', err);
  }

  activeConnections.delete(connectionId);
  console.log(`已关闭连接: ${connectionId}`);
}

/**
 * 测试数据库连接
 */
async function testConnection(connection: DbConnection): Promise<{ success: boolean; message: string }> {
  try {
    validateConnectionConfig(connection);
    
    const startTime = performance.now();
    
    switch (connection.type) {
      case 'mysql':
        return await testMySqlConnection(connection);
      case 'postgresql':
        return await testPostgresConnection(connection);
      case 'sqlite':
        return await testSqliteConnection(connection);
      default:
        return {
          success: false,
          message: `不支持的数据库类型: ${connection.type}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 验证连接配置
 */
function validateConnectionConfig(connection: DbConnection): void {
  if (!connection.name) {
    throw new Error('连接名称不能为空');
  }
  
  switch (connection.type) {
    case 'mysql':
    case 'postgresql':
      if (!connection.host) {
        throw new Error('主机地址不能为空');
      }
      if (!connection.port) {
        throw new Error('端口号不能为空');
      }
      if (!connection.database) {
        throw new Error('数据库名称不能为空');
      }
      break;
    case 'sqlite':
      if (!connection.filename) {
        throw new Error('数据库文件路径不能为空');
      }
      break;
    default:
      throw new Error(`不支持的数据库类型: ${connection.type}`);
  }
}

/**
 * 测试 MySQL 连接
 */
async function testMySqlConnection(connection: DbConnection): Promise<{ success: boolean; message: string }> {
  let conn: mysql.Connection | null = null;
  
  try {
    conn = await mysql.createConnection({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: connection.password,
      database: connection.database,
      ssl: connection.useSSL ? {} : undefined,
      connectTimeout: 10000 // 10秒超时
    });
    
    const [rows] = await conn.query('SELECT VERSION() as version');
    return {
      success: true,
      message: '连接成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

/**
 * 测试 PostgreSQL 连接
 */
async function testPostgresConnection(connection: DbConnection): Promise<{ success: boolean; message: string }> {
  const client = new PgClient({
    host: connection.host,
    port: connection.port,
    user: connection.username,
    password: connection.password,
    database: connection.database,
    ssl: connection.useSSL ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000 // 10秒超时
  });
  
  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    return {
      success: true,
      message: '连接成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    await client.end();
  }
}

/**
 * 测试 SQLite 连接
 */
async function testSqliteConnection(connection: DbConnection): Promise<{ success: boolean; message: string }> {
  let db: BetterSqlite3.Database | null = null;
  
  try {
    const dbPath = getSqliteDatabasePath(connection.filename || '');
    
    // 确保目录存在
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 修正 SQLite 数据库创建方式
    db = new BetterSqlite3(dbPath);
    db.prepare('SELECT sqlite_version()').get();
    
    return {
      success: true,
      message: '连接成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (db) {
      db.close();
    }
  }
}

/**
 * 获取SQLite数据库文件的绝对路径
 */
function getSqliteDatabasePath(databasePath: string): string {
  if (path.isAbsolute(databasePath)) {
    return databasePath;
  }
  
  // 相对路径，使用应用数据目录作为基础
  const basePath = app.getPath('userData');
  return path.join(basePath, 'databases', databasePath);
}

/**
 * 创建数据库连接
 */
async function createConnection(connection: DbConnection): Promise<void> {
  // 关闭可能存在的旧连接
  await closeConnection(connection.id);
  
  const newConnection: ActiveConnection = {
    config: connection,
    timestamp: Date.now()
  };
  
  try {
    switch (connection.type) {
      case 'mysql':
        newConnection.mysql = await mysql.createConnection({
          host: connection.host,
          port: connection.port,
          user: connection.username,
          password: connection.password,
          database: connection.database,
          ssl: connection.useSSL ? {} : undefined,
          connectTimeout: 10000
        });
        break;
        
      case 'postgresql':
        const pgClient = new PgClient({
          host: connection.host,
          port: connection.port,
          user: connection.username,
          password: connection.password,
          database: connection.database,
          ssl: connection.useSSL ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 10000
        });
        await pgClient.connect();
        newConnection.postgresql = pgClient;
        break;
        
      case 'sqlite':
        const dbPath = getSqliteDatabasePath(connection.filename || '');
        newConnection.sqlite = new BetterSqlite3(dbPath);
        break;
        
      default:
        throw new Error(`不支持的数据库类型: ${connection.type}`);
    }
    
    // 存储连接到缓存
    activeConnections.set(connection.id, newConnection);
  } catch (error) {
    // 清理可能创建的连接
    if (newConnection.mysql) await newConnection.mysql.end();
    if (newConnection.postgresql) await newConnection.postgresql.end();
    if (newConnection.sqlite) newConnection.sqlite.close();
    
    throw error;
  }
}

/**
 * 获取数据库对象列表
 */
async function getDatabaseObjects(
  connectionId: number,
  type?: 'table' | 'view' | 'procedure' | 'function'
): Promise<Array<{ name: string; type: 'table' | 'view' | 'procedure' | 'function'; schema?: string }>> {
  const conn = activeConnections.get(connectionId);
  if (!conn) {
    throw new Error(`找不到ID为 ${connectionId} 的连接`);
  }
  
  const objects: Array<{ name: string; type: 'table' | 'view' | 'procedure' | 'function'; schema?: string }> = [];
  
  try {
    switch (conn.config.type) {
      case 'mysql':
        if (!conn.mysql) throw new Error('MySQL连接未初始化');
        
        if (!type || type === 'table') {
          const [tables] = await conn.mysql.query(`
            SELECT TABLE_NAME as name
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
          `, [conn.config.database]);
          
          (tables as any[]).forEach(t => {
            objects.push({ name: t.name, type: 'table' });
          });
        }
        
        if (!type || type === 'view') {
          const [views] = await conn.mysql.query(`
            SELECT TABLE_NAME as name
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'VIEW'
            ORDER BY TABLE_NAME
          `, [conn.config.database]);
          
          (views as any[]).forEach(v => {
            objects.push({ name: v.name, type: 'view' });
          });
        }
        
        if (!type || type === 'procedure') {
          const [procedures] = await conn.mysql.query(`
            SELECT ROUTINE_NAME as name
            FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
            ORDER BY ROUTINE_NAME
          `, [conn.config.database]);
          
          (procedures as any[]).forEach(p => {
            objects.push({ name: p.name, type: 'procedure' });
          });
        }
        
        if (!type || type === 'function') {
          const [functions] = await conn.mysql.query(`
            SELECT ROUTINE_NAME as name
            FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'
            ORDER BY ROUTINE_NAME
          `, [conn.config.database]);
          
          (functions as any[]).forEach(f => {
            objects.push({ name: f.name, type: 'function' });
          });
        }
        break;
        
      case 'postgresql':
        if (!conn.postgresql) throw new Error('PostgreSQL连接未初始化');
        
        if (!type || type === 'table') {
          const tablesResult = await conn.postgresql.query(`
            SELECT table_name as name, table_schema as schema
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
          `);
          
          tablesResult.rows.forEach(row => {
            objects.push({ name: row.name, type: 'table', schema: row.schema });
          });
        }
        
        if (!type || type === 'view') {
          const viewsResult = await conn.postgresql.query(`
            SELECT table_name as name, table_schema as schema
            FROM information_schema.views
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
          `);
          
          viewsResult.rows.forEach(row => {
            objects.push({ name: row.name, type: 'view', schema: row.schema });
          });
        }
        
        if (!type || type === 'procedure' || type === 'function') {
          const functionsResult = await conn.postgresql.query(`
            SELECT routine_name as name, routine_schema as schema, routine_type
            FROM information_schema.routines
            WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY routine_schema, routine_name
          `);
          
          functionsResult.rows.forEach(row => {
            const routineType = row.routine_type === 'PROCEDURE' ? 'procedure' : 'function';
            if (!type || type === routineType) {
              objects.push({ name: row.name, type: routineType as any, schema: row.schema });
            }
          });
        }
        break;
        
      case 'sqlite':
        if (!conn.sqlite) throw new Error('SQLite连接未初始化');
        
        if (!type || type === 'table') {
          const tables = conn.sqlite.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
          `).all();
          
          tables.forEach(t => {
            objects.push({ name: (t as { name: string }).name, type: 'table' });
          });
        }
        
        if (!type || type === 'view') {
          const views = conn.sqlite.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='view'
            ORDER BY name
          `).all();
          
          views.forEach(v => {
            objects.push({ name: (v as { name: string }).name, type: 'view' });
          });
        }
        break;
    }
    
    return objects;
  } catch (error) {
    console.error(`获取 ${conn.config.type} 数据库对象失败:`, error);
    throw error;
  }
}

/**
 * 获取表列信息
 */
async function getTableColumns(
  connectionId: number,
  table: string,
  schema?: string
): Promise<Array<{
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  defaultValue?: string;
  comment?: string;
}>> {
  const conn = activeConnections.get(connectionId);
  if (!conn) {
    throw new Error(`找不到ID为 ${connectionId} 的连接`);
  }
  
  const columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimary: boolean;
    defaultValue?: string;
    comment?: string;
  }> = [];
  
  try {
    switch (conn.config.type) {
      case 'mysql':
        if (!conn.mysql) throw new Error('MySQL连接未初始化');
        
        const [mysqlColumns] = await conn.mysql.query(`
          SELECT 
            COLUMN_NAME as name, 
            DATA_TYPE as type,
            IS_NULLABLE = 'YES' as nullable,
            COLUMN_KEY = 'PRI' as isPrimary,
            COLUMN_DEFAULT as defaultValue,
            COLUMN_COMMENT as comment
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [conn.config.database, table]);
        
        (mysqlColumns as any[]).forEach(col => {
          columns.push({
            name: col.name,
            type: col.type,
            nullable: Boolean(col.nullable),
            isPrimary: Boolean(col.isPrimary),
            defaultValue: col.defaultValue,
            comment: col.comment
          });
        });
        break;
        
      case 'postgresql':
        if (!conn.postgresql) throw new Error('PostgreSQL连接未初始化');
        
        const pgSchema = schema || 'public';
        
        const pgColumnsResult = await conn.postgresql.query(`
          SELECT 
            c.column_name as name,
            c.data_type as type,
            c.is_nullable = 'YES' as nullable,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as isPrimary,
            c.column_default as defaultValue,
            d.description as comment
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON 
              tc.constraint_name = kcu.constraint_name AND 
              tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = $1
            AND tc.table_name = $2
          ) pk ON c.column_name = pk.column_name
          LEFT JOIN pg_catalog.pg_description d ON 
            d.objoid = (quote_ident($1) || '.' || quote_ident($2))::regclass AND 
            d.objsubid = c.ordinal_position
          WHERE c.table_schema = $1
          AND c.table_name = $2
          ORDER BY c.ordinal_position
        `, [pgSchema, table]);
        
        pgColumnsResult.rows.forEach(col => {
          columns.push({
            name: col.name,
            type: col.type,
            nullable: Boolean(col.nullable),
            isPrimary: Boolean(col.isprimary),
            defaultValue: col.defaultvalue,
            comment: col.comment
          });
        });
        break;
        
      case 'sqlite':
        if (!conn.sqlite) throw new Error('SQLite连接未初始化');
        
        // 获取表信息
        const tableInfo = conn.sqlite.prepare(`PRAGMA table_info(${table})`).all();
        
        tableInfo.forEach((col: any) => {
          columns.push({
            name: col.name,
            type: col.type,
            nullable: !col.notnull,
            isPrimary: Boolean(col.pk),
            defaultValue: col.dflt_value
          });
        });
        break;
    }
    
    return columns;
  } catch (error) {
    console.error(`获取表 ${table} 列信息失败:`, error);
    throw error;
  }
}

/**
 * 执行SQL查询
 */
async function executeQuery(
  connectionId: number,
  sql: string,
  params: any[] = []
): Promise<{
  columns?: string[];
  rows?: any[];
  affectedRows?: number;
  error?: string;
}> {
  const conn = activeConnections.get(connectionId);
  if (!conn) {
    return { error: `找不到ID为 ${connectionId} 的连接` };
  }
  
  try {
    switch (conn.config.type) {
      case 'mysql':
        if (!conn.mysql) throw new Error('MySQL连接未初始化');
        
        const [mysqlResults, mysqlFields] = await conn.mysql.query(sql, params);
        
        // 判断是否为查询语句的结果
        if (Array.isArray(mysqlResults)) {
          // 查询语句结果
          const columns = (mysqlFields as mysql.FieldPacket[]).map(field => field.name);
          return {
            columns,
            rows: mysqlResults as any[]
          };
        } else {
          // 非查询语句结果 (INSERT, UPDATE, DELETE 等)
          return {
            affectedRows: (mysqlResults as mysql.ResultSetHeader).affectedRows
          };
        }
        
      case 'postgresql':
        if (!conn.postgresql) throw new Error('PostgreSQL连接未初始化');
        
        const pgResult = await conn.postgresql.query(sql, params);
        
        // 非查询语句有 rowCount 但没有列定义
        if (pgResult.rowCount !== undefined && pgResult.fields.length === 0) {
          return { affectedRows: pgResult.rowCount };
        } else {
          return {
            columns: pgResult.fields.map(field => field.name),
            rows: pgResult.rows
          };
        }
        
      case 'sqlite':
        if (!conn.sqlite) throw new Error('SQLite连接未初始化');
        
        // 判断是否为查询语句
        const sqlTrimmed = sql.trim().toLowerCase();
        if (sqlTrimmed.startsWith('select') || 
            sqlTrimmed.startsWith('pragma') ||
            sqlTrimmed.startsWith('explain')) {
          try {
            // SQLite 不支持参数化查询的占位符数组，需要处理参数
            const stmt = conn.sqlite.prepare(sql);
            const rows = stmt.all(params);
            
            // 从第一行数据获取列名
            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
            
            return { columns, rows };
          } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
          }
        } else {
          try {
            // 执行非查询语句
            const stmt = conn.sqlite.prepare(sql);
            const result = stmt.run(params);
            
            return { affectedRows: result.changes };
          } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
          }
        }
        
      default:
        return { error: `不支持的数据库类型: ${conn.config.type}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 获取存储过程定义
 */
async function getProcedureDefinition(
  connectionId: number,
  procedure: string,
  schema?: string
): Promise<string> {
  const conn = activeConnections.get(connectionId);
  if (!conn) {
    throw new Error(`找不到ID为 ${connectionId} 的连接`);
  }
  
  try {
    switch (conn.config.type) {
      case 'mysql':
        if (!conn.mysql) throw new Error('MySQL连接未初始化');
        
        const [mysqlResult] = await conn.mysql.query(`
          SELECT ROUTINE_DEFINITION
          FROM information_schema.ROUTINES
          WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ?
        `, [conn.config.database, procedure]);
        
        const mysqlRows = mysqlResult as any[];
        return mysqlRows.length > 0 ? mysqlRows[0].ROUTINE_DEFINITION : '';
        
      case 'postgresql':
        if (!conn.postgresql) throw new Error('PostgreSQL连接未初始化');
        
        const pgSchema = schema || 'public';
        
        const pgResult = await conn.postgresql.query(`
          SELECT pg_get_functiondef(p.oid) as definition
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = $1 AND p.proname = $2
        `, [pgSchema, procedure]);
        
        return pgResult.rowCount > 0 ? pgResult.rows[0].definition : '';
        
      case 'sqlite':
        if (!conn.sqlite) throw new Error('SQLite连接未初始化');
        
        // SQLite 不支持存储过程，返回空字符串
        return '';
        
      default:
        throw new Error(`不支持的数据库类型: ${conn.config.type}`);
    }
  } catch (error) {
    console.error(`获取存储过程 ${procedure} 定义失败:`, error);
    throw error;
  }
}

/**
 * 获取数据库列表
 */
async function getDatabases(connectionId: number): Promise<string[]> {
  const conn = activeConnections.get(connectionId);
  if (!conn) {
    throw new Error(`找不到ID为 ${connectionId} 的连接`);
  }
  
  try {
    switch (conn.config.type) {
      case 'mysql':
        if (!conn.mysql) throw new Error('MySQL连接未初始化');
        
        const [mysqlResults] = await conn.mysql.query(`
          SHOW DATABASES
        `);
        
        return (mysqlResults as any[]).map(row => row.Database);
        
      case 'postgresql':
        if (!conn.postgresql) throw new Error('PostgreSQL连接未初始化');
        
        const pgResult = await conn.postgresql.query(`
          SELECT datname FROM pg_database
          WHERE datistemplate = false
          ORDER BY datname
        `);
        
        return pgResult.rows.map(row => row.datname);
        
      case 'sqlite':
        // SQLite 不支持多数据库，返回当前数据库名称
        return [conn.config.filename || 'main'];
        
      default:
        throw new Error(`不支持的数据库类型: ${conn.config.type}`);
    }
  } catch (error) {
    console.error('获取数据库列表失败:', error);
    throw error;
  }
}

/**
 * 切换数据库
 */
async function changeDatabase(
  connectionId: number,
  database: string
): Promise<{ success: boolean; message?: string }> {
  const conn = activeConnections.get(connectionId);
  if (!conn) {
    return { success: false, message: `找不到ID为 ${connectionId} 的连接` };
  }
  
  try {
    switch (conn.config.type) {
      case 'mysql':
        if (!conn.mysql) {
          return { success: false, message: 'MySQL连接未初始化' };
        }
        
        // 需要重新创建连接
        await conn.mysql.end();
        
        conn.mysql = await mysql.createConnection({
          host: conn.config.host,
          port: conn.config.port,
          user: conn.config.username,
          password: conn.config.password,
          database: database,
          ssl: conn.config.useSSL ? {} : undefined,
          connectTimeout: 10000
        });
        
        // 更新配置
        conn.config.database = database;
        return { success: true };
        
      case 'postgresql':
        if (!conn.postgresql) {
          return { success: false, message: 'PostgreSQL连接未初始化' };
        }
        
        // 需要重新创建连接
        await conn.postgresql.end();
        
        const pgClient = new PgClient({
          host: conn.config.host,
          port: conn.config.port,
          user: conn.config.username,
          password: conn.config.password,
          database: database,
          ssl: conn.config.useSSL ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 10000
        });
        
        await pgClient.connect();
        conn.postgresql = pgClient;
        
        // 更新配置
        conn.config.database = database;
        return { success: true };
        
      case 'sqlite':
        return { success: false, message: 'SQLite 不支持切换数据库' };
        
      default:
        return { success: false, message: `不支持的数据库类型: ${conn.config.type}` };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 