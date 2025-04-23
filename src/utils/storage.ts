/**
 * 本地存储工具
 * 提供数据库连接信息等数据的本地持久化存储
 */
import { type DbConnection } from '../services/database';
import CryptoJS from 'crypto-js';

// 存储键名
const STORAGE_KEYS = {
  CONNECTIONS: 'electron-dbm-connections',
  CONNECTION_GROUPS: 'electron-dbm-connection-groups',
  SETTINGS: 'electron-dbm-settings',
  QUERY_HISTORY: 'electron-dbm-query-history',
};

// 加密密钥（实际应用中应从安全存储获取）
const ENCRYPTION_KEY = 'electron-dbm-secret-key';

// 分组接口
export interface ConnectionGroup {
  id: string;
  name: string;
  color?: string;
  expanded?: boolean;
}

/**
 * 存储工具类
 */
export class StorageService {
  /**
   * 保存数据库连接列表
   * @param connections 数据库连接列表
   */
  saveConnections(connections: DbConnection[]): void {
    try {
      // 对敏感信息进行加密
      const encryptedConnections = connections.map(conn => {
        const encrypted = { ...conn };
        if (encrypted.password) {
          encrypted.password = this.encrypt(encrypted.password);
        }
        return encrypted;
      });
      
      localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(encryptedConnections));
    } catch (error) {
      console.error('保存连接信息失败:', error);
    }
  }

  /**
   * 加载数据库连接列表
   * @returns 数据库连接列表
   */
  loadConnections(): DbConnection[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (data) {
        // 解密敏感信息
        const connections = JSON.parse(data) as DbConnection[];
        return connections.map(conn => {
          const decrypted = { ...conn };
          if (decrypted.password && decrypted.password.startsWith('encrypted:')) {
            decrypted.password = this.decrypt(decrypted.password);
          }
          return decrypted;
        });
      }
    } catch (error) {
      console.error('加载连接信息失败:', error);
    }
    
    // 返回默认连接示例
    return [
      {
        id: 1,
        name: '本地 MySQL',
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test_db',
        username: 'root',
        password: '******',
        group: '默认'
      }
    ];
  }

  /**
   * 获取指定ID的连接
   * @param id 连接ID
   * @returns 找到的连接或undefined
   */
  getConnection(id: number): DbConnection | undefined {
    const connections = this.loadConnections();
    return connections.find(c => c.id === id);
  }

  /**
   * 按分组获取连接
   * @returns 按分组组织的连接字典
   */
  getConnectionsByGroup(): Record<string, DbConnection[]> {
    const connections = this.loadConnections();
    const result: Record<string, DbConnection[]> = {};
    
    // 为没有分组的连接设置默认分组
    connections.forEach(conn => {
      if (!conn.group) {
        conn.group = '默认';
      }
      
      if (!result[conn.group]) {
        result[conn.group] = [];
      }
      
      result[conn.group].push(conn);
    });
    
    return result;
  }

  /**
   * 保存连接分组
   * @param groups 连接分组列表
   */
  saveConnectionGroups(groups: ConnectionGroup[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONNECTION_GROUPS, JSON.stringify(groups));
    } catch (error) {
      console.error('保存分组信息失败:', error);
    }
  }

  /**
   * 加载连接分组
   * @returns 连接分组列表
   */
  loadConnectionGroups(): ConnectionGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONNECTION_GROUPS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载分组信息失败:', error);
    }
    
    // 返回默认分组
    return [
      {
        id: 'default',
        name: '默认',
        color: '#2196f3',
        expanded: true
      }
    ];
  }

  /**
   * 导出连接信息为文件
   * @param connections 要导出的连接列表
   * @param includePasswords 是否包含密码
   * @returns 导出的JSON字符串
   */
  exportConnections(connections: DbConnection[], includePasswords: boolean = false): string {
    const exportData = connections.map(conn => {
      const exported = { ...conn };
      
      // 根据设置决定是否导出密码
      if (!includePasswords) {
        exported.password = '';
      }
      
      return exported;
    });
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入连接信息
   * @param jsonData 导入的JSON字符串
   * @returns 导入的连接列表
   */
  importConnections(jsonData: string): DbConnection[] {
    try {
      const importedConnections = JSON.parse(jsonData) as DbConnection[];
      const existingConnections = this.loadConnections();
      
      // 查找最大ID
      const maxId = existingConnections.length > 0 
        ? Math.max(...existingConnections.map(c => c.id)) 
        : 0;
      
      // 为导入的连接分配新ID
      const newConnections = importedConnections.map((conn, index) => ({
        ...conn,
        id: maxId + index + 1
      }));
      
      // 合并连接列表并保存
      const mergedConnections = [...existingConnections, ...newConnections];
      this.saveConnections(mergedConnections);
      
      return newConnections;
    } catch (error) {
      console.error('导入连接失败:', error);
      throw new Error('导入的数据格式无效');
    }
  }

  /**
   * 加密字符串
   * @param text 要加密的文本
   * @returns 加密后的文本
   */
  private encrypt(text: string): string {
    try {
      if (!text) return text;
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return `encrypted:${encrypted}`;
    } catch (error) {
      console.error('加密失败:', error);
      return text; // 失败时返回原文本
    }
  }

  /**
   * 解密字符串
   * @param encryptedText 加密的文本
   * @returns 解密后的文本
   */
  private decrypt(encryptedText: string): string {
    try {
      if (!encryptedText || !encryptedText.startsWith('encrypted:')) return encryptedText;
      
      const textToDecrypt = encryptedText.substring(10); // 移除 "encrypted:" 前缀
      const decrypted = CryptoJS.AES.decrypt(textToDecrypt, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      return encryptedText; // 失败时返回加密文本
    }
  }

  /**
   * 清除所有存储数据（用于测试和重置）
   */
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

// 创建并导出存储服务实例
export const storageService = new StorageService(); 