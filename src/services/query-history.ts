/**
 * 查询历史记录服务
 * 提供查询历史的存储和管理功能
 */

// 存储键名
const STORAGE_KEY = 'electron-dbm-query-history';

// 最大历史记录数量
const MAX_HISTORY_ITEMS = 100;

// 查询历史项
export interface QueryHistoryItem {
  id: string;            // 唯一ID
  connectionId: number;  // 连接ID
  database: string;      // 数据库名称
  sql: string;           // SQL查询语句
  timestamp: number;     // 执行时间戳
  duration: number;      // 执行时长（毫秒）
  rowCount?: number;     // 结果行数（如果有）
  favorite?: boolean;    // 是否已收藏
  tags?: string[];       // 标签（可选）
  name?: string;         // 自定义名称（可选）
}

/**
 * 查询历史记录服务类
 */
export class QueryHistoryService {
  private historyItems: QueryHistoryItem[] = [];
  
  constructor() {
    this.loadHistory();
  }
  
  /**
   * 添加查询到历史记录
   * @param connectionId 连接ID
   * @param database 数据库名称
   * @param sql SQL查询语句
   * @param duration 执行时长（毫秒）
   * @param rowCount 结果行数（可选）
   * @returns 新添加的历史记录项
   */
  addQueryToHistory(
    connectionId: number,
    database: string,
    sql: string,
    duration: number,
    rowCount?: number
  ): QueryHistoryItem {
    // 创建新的历史记录项
    const newItem: QueryHistoryItem = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connectionId,
      database,
      sql,
      timestamp: Date.now(),
      duration,
      rowCount,
      favorite: false
    };
    
    // 添加到历史记录
    this.historyItems.unshift(newItem);
    
    // 限制历史记录数量
    if (this.historyItems.length > MAX_HISTORY_ITEMS) {
      // 保留收藏项
      const favoriteItems = this.historyItems.filter(item => item.favorite);
      const nonFavoriteItems = this.historyItems.filter(item => !item.favorite);
      
      // 裁剪非收藏项
      const remainingCount = MAX_HISTORY_ITEMS - favoriteItems.length;
      const trimmedNonFavorites = remainingCount > 0 
        ? nonFavoriteItems.slice(0, remainingCount) 
        : [];
      
      // 合并收藏项和非收藏项
      this.historyItems = [...favoriteItems, ...trimmedNonFavorites];
    }
    
    // 保存历史记录
    this.saveHistory();
    
    return newItem;
  }
  
  /**
   * 获取查询历史
   * @param connectionId 连接ID（可选，筛选特定连接的历史）
   * @param limit 限制返回数量（可选）
   * @returns 查询历史记录列表
   */
  getQueryHistory(connectionId?: number, limit?: number): QueryHistoryItem[] {
    let result = this.historyItems;
    
    // 按连接筛选
    if (connectionId !== undefined) {
      result = result.filter(item => item.connectionId === connectionId);
    }
    
    // 限制数量
    if (limit !== undefined && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }
  
  /**
   * 获取收藏的查询
   * @param connectionId 连接ID（可选，筛选特定连接的收藏）
   * @returns 收藏的查询列表
   */
  getFavoriteQueries(connectionId?: number): QueryHistoryItem[] {
    let result = this.historyItems.filter(item => item.favorite);
    
    // 按连接筛选
    if (connectionId !== undefined) {
      result = result.filter(item => item.connectionId === connectionId);
    }
    
    return result;
  }
  
  /**
   * 设置查询收藏状态
   * @param queryId 查询ID
   * @param favorite 是否收藏
   * @returns 是否成功
   */
  setQueryFavorite(queryId: string, favorite: boolean): boolean {
    const query = this.historyItems.find(item => item.id === queryId);
    
    if (query) {
      query.favorite = favorite;
      this.saveHistory();
      return true;
    }
    
    return false;
  }
  
  /**
   * 设置查询名称
   * @param queryId 查询ID
   * @param name 自定义名称
   * @returns 是否成功
   */
  setQueryName(queryId: string, name: string): boolean {
    const query = this.historyItems.find(item => item.id === queryId);
    
    if (query) {
      query.name = name;
      this.saveHistory();
      return true;
    }
    
    return false;
  }
  
  /**
   * 添加标签到查询
   * @param queryId 查询ID
   * @param tag 标签
   * @returns 是否成功
   */
  addTagToQuery(queryId: string, tag: string): boolean {
    const query = this.historyItems.find(item => item.id === queryId);
    
    if (query) {
      if (!query.tags) {
        query.tags = [];
      }
      
      if (!query.tags.includes(tag)) {
        query.tags.push(tag);
        this.saveHistory();
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 移除查询标签
   * @param queryId 查询ID
   * @param tag 标签
   * @returns 是否成功
   */
  removeTagFromQuery(queryId: string, tag: string): boolean {
    const query = this.historyItems.find(item => item.id === queryId);
    
    if (query && query.tags) {
      const index = query.tags.indexOf(tag);
      
      if (index !== -1) {
        query.tags.splice(index, 1);
        this.saveHistory();
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 按标签筛选查询
   * @param tag 标签
   * @returns 查询列表
   */
  getQueriesByTag(tag: string): QueryHistoryItem[] {
    return this.historyItems.filter(
      item => item.tags && item.tags.includes(tag)
    );
  }
  
  /**
   * 删除查询历史
   * @param queryId 查询ID
   * @returns 是否成功
   */
  deleteQuery(queryId: string): boolean {
    const index = this.historyItems.findIndex(item => item.id === queryId);
    
    if (index !== -1) {
      this.historyItems.splice(index, 1);
      this.saveHistory();
      return true;
    }
    
    return false;
  }
  
  /**
   * 清空所有历史记录
   * @param keepFavorites 是否保留收藏项
   */
  clearHistory(keepFavorites: boolean = true): void {
    if (keepFavorites) {
      this.historyItems = this.historyItems.filter(item => item.favorite);
    } else {
      this.historyItems = [];
    }
    
    this.saveHistory();
  }
  
  /**
   * 导出查询历史为JSON字符串
   * @param onlyFavorites 是否仅导出收藏的查询
   * @returns JSON字符串形式的查询历史
   */
  exportHistory(onlyFavorites: boolean = false): string {
    const items = onlyFavorites 
      ? this.historyItems.filter(item => item.favorite)
      : this.historyItems;
    
    return JSON.stringify(items, null, 2);
  }
  
  /**
   * 导入查询历史
   * @param jsonData JSON字符串形式的查询历史
   * @param replace 是否替换现有历史记录（否则追加）
   * @returns 导入的记录数
   */
  importHistory(jsonData: string, replace: boolean = false): number {
    try {
      const importedItems = JSON.parse(jsonData) as QueryHistoryItem[];
      
      if (!Array.isArray(importedItems)) {
        throw new Error('导入的数据格式无效');
      }
      
      // 验证导入的每个项目格式是否正确
      for (const item of importedItems) {
        if (!item.id || !item.sql || !item.connectionId || !item.timestamp) {
          throw new Error('导入的数据缺少必要字段');
        }
      }
      
      // 替换或追加历史记录
      if (replace) {
        this.historyItems = importedItems;
      } else {
        // 追加，避免重复ID
        const existingIds = new Set(this.historyItems.map(item => item.id));
        const newItems = importedItems.filter(item => !existingIds.has(item.id));
        this.historyItems = [...this.historyItems, ...newItems];
      }
      
      this.saveHistory();
      return importedItems.length;
    } catch (error) {
      console.error('导入查询历史失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载历史记录
   */
  private loadHistory(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      
      if (data) {
        this.historyItems = JSON.parse(data);
      }
    } catch (error) {
      console.error('加载查询历史失败:', error);
      this.historyItems = [];
    }
  }
  
  /**
   * 保存历史记录
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.historyItems));
    } catch (error) {
      console.error('保存查询历史失败:', error);
    }
  }
}

// 创建并导出查询历史服务实例
export const queryHistoryService = new QueryHistoryService(); 