/**
 * 数据库服务
 * 处理数据库连接和查询操作
 */

import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 使用预加载脚本暴露的API
const { invoke } = window.electronAPI;

export interface DbConnection {
  id: number;
  name: string;
  type: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  filename?: string;
  group?: string;
  useSSL?: boolean;
  timeout?: number;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface DbObject {
  name: string;
  type: 'table' | 'view' | 'procedure' | 'function';
  schema?: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  affectedRows?: number;
  executionTime: number;
  error?: string;
}

// 添加测试结果接口定义
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
  serverInfo?: {
    version?: string;
    platform?: string;
    connectionId?: number;
    charset?: string;
    timezone?: string;
  };
  timing?: {
    connect: number;
    query?: number;
    total: number;
  };
}

// 定义对象类型
export type DbObjectType = 'table' | 'view' | 'procedure' | 'function';

// 状态管理：当前连接
export const currentConnection = ref<DbConnection | null>(null);
export const connectionStatus = ref<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
export const connectionError = ref<string | null>(null);

/**
 * 测试数据库连接
 * @param connection 数据库连接信息
 * @returns 测试结果，包含是否成功和可能的错误信息
 */
export async function testConnection(connection: DbConnection): Promise<ConnectionTestResult> {
  try {
    const result = await invoke('db:test-connection', connection);
    return result;
  } catch (error) {
    console.error('测试连接失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 连接到数据库
 * @param connection 数据库连接信息
 * @returns 连接结果
 */
export async function connectToDatabase(connection: DbConnection): Promise<boolean> {
  try {
    connectionStatus.value = 'connecting';
    connectionError.value = null;
    
    const result = await invoke('db:connect', connection);
    
    if (result.success) {
      currentConnection.value = connection;
      connectionStatus.value = 'connected';
      return true;
    } else {
      connectionError.value = result.message;
      connectionStatus.value = 'error';
      ElMessage.error(`连接失败: ${result.message}`);
      return false;
    }
  } catch (error) {
    connectionStatus.value = 'error';
    connectionError.value = error instanceof Error ? error.message : String(error);
    ElMessage.error(`连接失败: ${connectionError.value}`);
    return false;
  }
}

/**
 * 断开当前数据库连接
 */
export async function disconnectDatabase(): Promise<void> {
  if (currentConnection.value) {
    try {
      await invoke('db:disconnect', currentConnection.value.id);
      currentConnection.value = null;
      connectionStatus.value = 'disconnected';
    } catch (error) {
      console.error('断开连接失败:', error);
      ElMessage.warning('断开连接时发生错误，但已在本地标记为已断开');
      currentConnection.value = null;
      connectionStatus.value = 'disconnected';
    }
  }
}

/**
 * 获取数据库对象列表（表、视图、存储过程等）
 * @param connectionId 数据库连接ID
 * @param type 对象类型，可选，不指定则返回所有类型
 * @returns 数据库对象列表
 */
export async function getDatabaseObjects(
  connectionId: number,
  type?: DbObjectType
): Promise<DbObject[]> {
  try {
    const objects = await invoke('db:get-objects', {
      connectionId,
      type
    });
    return objects;
  } catch (error) {
    console.error('获取数据库对象失败:', error);
    ElMessage.error('获取数据库对象失败');
    return [];
  }
}

/**
 * 获取表的列信息
 * @param connectionId 数据库连接ID
 * @param table 表名
 * @param schema 模式名（可选）
 * @returns 表列信息
 */
export async function getTableColumns(
  connectionId: number,
  table: string,
  schema?: string
): Promise<TableColumn[]> {
  try {
    const columns = await invoke('db:get-table-columns', {
      connectionId,
      table,
      schema
    });
    return columns;
  } catch (error) {
    console.error('获取表列信息失败:', error);
    ElMessage.error('获取表列信息失败');
    return [];
  }
}

/**
 * 执行 SQL 查询
 * @param connectionId 数据库连接ID
 * @param sql SQL 查询语句
 * @param params 查询参数（可选）
 * @returns 查询结果
 */
export async function executeQuery(
  connectionId: number,
  sql: string,
  params?: any[]
): Promise<QueryResult> {
  const startTime = performance.now();
  
  try {
    const result = await invoke('db:execute-query', {
      connectionId,
      sql,
      params: params || []
    });
    
    const executionTime = performance.now() - startTime;
    
    if (result.error) {
      return {
        columns: [],
        rows: [],
        executionTime,
        error: result.error
      };
    }
    
    return {
      columns: result.columns || [],
      rows: result.rows || [],
      affectedRows: result.affectedRows,
      executionTime
    };
  } catch (error) {
    const executionTime = performance.now() - startTime;
    console.error('执行查询失败:', error);
    
    return {
      columns: [],
      rows: [],
      executionTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 获取存储过程的详细信息
 * @param connectionId 数据库连接ID
 * @param procedure 存储过程名称
 * @param schema 模式名（可选）
 * @returns 存储过程定义
 */
export async function getProcedureDefinition(
  connectionId: number,
  procedure: string,
  schema?: string
): Promise<string> {
  try {
    const definition = await invoke('db:get-procedure-definition', {
      connectionId,
      procedure,
      schema
    });
    return definition;
  } catch (error) {
    console.error('获取存储过程定义失败:', error);
    ElMessage.error('获取存储过程定义失败');
    return '';
  }
}

/**
 * 获取可用的数据库列表
 * @param connectionId 数据库连接ID
 * @returns 数据库名称列表
 */
export async function getDatabases(connectionId: number): Promise<string[]> {
  try {
    const databases = await invoke('db:get-databases', {
      connectionId
    });
    return databases;
  } catch (error) {
    console.error('获取数据库列表失败:', error);
    ElMessage.error('获取数据库列表失败');
    return [];
  }
}

/**
 * 切换当前数据库
 * @param connectionId 数据库连接ID
 * @param database 要切换到的数据库名称
 * @returns 是否成功
 */
export async function changeDatabase(
  connectionId: number,
  database: string
): Promise<boolean> {
  try {
    const result = await invoke('db:change-database', {
      connectionId,
      database
    });
    
    if (result.success) {
      // 更新当前连接信息中的数据库名
      if (currentConnection.value && currentConnection.value.id === connectionId) {
        currentConnection.value = {
          ...currentConnection.value,
          database
        };
      }
      return true;
    } else {
      ElMessage.error(`切换数据库失败: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('切换数据库失败:', error);
    ElMessage.error('切换数据库失败');
    return false;
  }
}

/**
 * 根据ID获取连接信息
 * @param connectionId 连接ID
 * @returns 连接信息
 */
export function getConnection(connectionId: number): DbConnection | null {
  // 如果是当前连接，直接返回
  if (currentConnection.value && currentConnection.value.id === connectionId) {
    return currentConnection.value;
  }
  
  // 否则从本地存储中查找
  try {
    const connectionsJson = localStorage.getItem('connections');
    if (connectionsJson) {
      const connections = JSON.parse(connectionsJson) as DbConnection[];
      return connections.find(conn => conn.id === connectionId) || null;
    }
  } catch (error) {
    console.error('获取连接信息失败:', error);
  }
  
  return null;
}

// 导出统一的数据库服务对象，以兼容现有代码
export const databaseService = {
  testConnection,
  connectToDatabase,
  disconnectDatabase,
  getDatabaseObjects,
  getTableColumns,
  executeQuery,
  getProcedureDefinition,
  getDatabases,
  changeDatabase,
  getConnection
}; 