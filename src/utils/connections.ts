import { storageService } from './storage';
import { DbConnection } from '../services/database';

/**
 * 根据ID获取数据库连接信息
 * @param connectionId 连接ID
 * @returns 数据库连接信息或null
 */
export function getConnectionById(connectionId: number): DbConnection | null {
  return storageService.getConnection(connectionId) || null;
}

/**
 * 获取所有数据库连接
 * @returns 数据库连接列表
 */
export function getAllConnections(): DbConnection[] {
  return storageService.loadConnections();
}

/**
 * 获取分组内的数据库连接
 * @param groupName 分组名称
 * @returns 数据库连接列表
 */
export function getConnectionsByGroup(groupName: string): DbConnection[] {
  const connections = storageService.loadConnections();
  return connections.filter(conn => conn.group === groupName);
}

/**
 * 获取连接类型对应的图标
 * @param connectionType 连接类型
 * @returns 图标名称
 */
export function getConnectionTypeIcon(connectionType: string): string {
  switch (connectionType) {
    case 'mysql':
      return 'simple-icons:mysql';
    case 'postgresql':
      return 'simple-icons:postgresql';
    case 'sqlite':
      return 'simple-icons:sqlite';
    default:
      return 'mdi:database';
  }
} 