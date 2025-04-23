<template>
  <div class="h-full flex flex-col">
    <!-- 数据库和查询标签 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
      <el-tabs v-model="activeTab" class="demo-tabs" type="card" closable @tab-remove="removeTab">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :label="tab.title"
          :name="tab.name"
        ></el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 主内容 -->
    <div class="flex-1 flex">
      <!-- 数据库对象侧边栏 -->
      <div class="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        <el-tabs class="h-full flex flex-col">
          <el-tab-pane label="数据库" name="database">
            <div class="p-3">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">数据库: {{ connection?.database }}</h3>
              
              <el-menu
                default-active="1"
                class="border-0 dark:bg-gray-800 dark:text-gray-200"
                background-color="transparent"
              >
                <el-sub-menu index="tables">
                  <template #title>
                    <span class="text-sm">表</span>
                  </template>
                  <el-menu-item v-for="table in databaseObjects.tables" :key="table" :index="`table-${table}`"
                    @click="openTable(table)">
                    {{ table }}
                  </el-menu-item>
                </el-sub-menu>
                
                <el-sub-menu index="views">
                  <template #title>
                    <span class="text-sm">视图</span>
                  </template>
                  <el-menu-item v-for="view in databaseObjects.views" :key="view" :index="`view-${view}`">
                    {{ view }}
                  </el-menu-item>
                </el-sub-menu>
                
                <el-sub-menu index="procedures">
                  <template #title>
                    <span class="text-sm">存储过程</span>
                  </template>
                  <el-menu-item v-for="proc in databaseObjects.procedures" :key="proc" :index="`proc-${proc}`">
                    {{ proc }}
                  </el-menu-item>
                </el-sub-menu>
              </el-menu>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="收藏" name="favorites">
            <div class="p-3">
              <FavoriteQueries @query-selected="loadSavedQuery" />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="查询构建器" name="builder">
            <div class="p-3">
              <QueryBuilder 
                :tables="databaseObjects.tables"
                :columns="tableColumns"
                @apply-query="loadSavedQuery"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 查询编辑器和结果 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- 查询编辑器 -->
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 h-2/5 overflow-hidden flex flex-col">
          <div class="flex justify-between items-center mb-2">
            <div>
              <el-button-group>
                <el-button type="primary" size="small" @click="executeQuery">
                  <Icon icon="mdi:play" class="mr-1" /> 执行
                </el-button>
                <el-button size="small" @click="showSaveQueryDialog = true">
                  <Icon icon="mdi:content-save" class="mr-1" /> 保存
                </el-button>
                <el-button size="small" @click="newQuery">
                  <Icon icon="mdi:file-plus" class="mr-1" /> 新建
                </el-button>
              </el-button-group>
              <el-button-group class="ml-2">
                <el-button size="small" @click="formatSql">
                  <Icon icon="mdi:format-align-left" class="mr-1" /> 格式化
                </el-button>
                <el-popover
                  placement="bottom"
                  :width="300"
                  trigger="click"
                >
                  <template #reference>
                    <el-button size="small">
                      <Icon icon="mdi:cog" class="mr-1" /> 格式选项
                    </el-button>
                  </template>
                  
                  <div class="p-2">
                    <h4 class="text-sm font-medium mb-3">SQL 格式化选项</h4>
                    
                    <div class="mb-2">
                      <el-checkbox v-model="formatOptions.uppercase">
                        关键字大写
                      </el-checkbox>
                    </div>
                    
                    <div class="mb-2">
                      <div class="text-sm mb-1">缩进:</div>
                      <el-radio-group v-model="formatOptions.indentSize" size="small">
                        <el-radio-button :label="2">2空格</el-radio-button>
                        <el-radio-button :label="4">4空格</el-radio-button>
                        <el-radio-button :label="0">Tab</el-radio-button>
                      </el-radio-group>
                    </div>
                  </div>
                </el-popover>
              </el-button-group>
            </div>
            <div>
              <el-select v-model="selectedDatabase" placeholder="选择数据库" size="small">
                <el-option
                  v-for="db in availableDatabases"
                  :key="db"
                  :label="db"
                  :value="db"
                ></el-option>
              </el-select>
            </div>
          </div>
          
          <!-- 这在实际应用中会是一个代码编辑器，如 Monaco -->
          <div class="flex-1 overflow-hidden">
            <SqlEditor
              v-model="sqlQuery"
              height="100%"
              :theme="isDarkMode ? 'vs-dark' : 'vs'"
              :database-tables="databaseObjects.tables"
              :database-columns="tableColumns"
              @execute-query="executeQuery"
              ref="sqlEditorRef"
            />
          </div>
        </div>
        
        <!-- 查询结果 -->
        <div class="flex-1 overflow-auto p-3">
          <div class="mb-2 flex justify-between items-center">
            <h3 class="text-sm font-medium">查询结果</h3>
            <div>
              <span v-if="queryExecuted" class="text-xs text-gray-500 dark:text-gray-400 mr-3">
                {{ queryResults.length }} 行记录，用时 {{ executionTime }}ms
              </span>
              <el-dropdown v-if="queryExecuted" @command="exportQueryResults" class="ml-2">
                <el-button size="small" type="success" plain>
                  <Icon icon="mdi:export" class="mr-1" /> 导出
                  <Icon icon="mdi:chevron-down" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="csv">
                      <Icon icon="mdi:file-delimited" class="mr-2" /> 导出为 CSV
                    </el-dropdown-item>
                    <el-dropdown-item command="json">
                      <Icon icon="mdi:code-json" class="mr-2" /> 导出为 JSON
                    </el-dropdown-item>
                    <el-dropdown-item command="sql">
                      <Icon icon="mdi:database" class="mr-2" /> 导出为 SQL INSERT
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <el-table v-if="queryExecuted" :data="queryResults" border style="width: 100%" height="100%">
            <el-table-column 
              v-for="column in resultColumns" 
              :key="column" 
              :prop="column" 
              :label="column"
              :width="150"
            ></el-table-column>
          </el-table>
          
          <el-empty v-else description="暂无查询结果，请执行查询"></el-empty>
        </div>
      </div>
    </div>
  </div>

  <!-- 保存查询对话框 -->
  <el-dialog
    v-model="showSaveQueryDialog"
    title="保存查询"
    width="500px"
  >
    <el-form :model="saveQueryForm" label-width="80px">
      <el-form-item label="名称">
        <el-input v-model="saveQueryForm.name" placeholder="输入查询名称..."></el-input>
      </el-form-item>
      
      <el-form-item label="标签">
        <el-select
          v-model="saveQueryForm.tags"
          multiple
          filterable
          allow-create
          placeholder="添加标签..."
          style="width: 100%;"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          ></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item>
        <el-checkbox v-model="saveQueryForm.asFavorite">添加到收藏</el-checkbox>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showSaveQueryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveQuery">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ElMessage } from 'element-plus';
import { storageService } from '../utils/storage';
import { type DbConnection } from '../services/database';
import { queryHistoryService } from '../services/query-history';
import { sqlFormatter } from '../services/sql-formatter';
import FavoriteQueries from '../components/FavoriteQueries.vue';
import SqlEditor from '../components/SqlEditor.vue';
import QueryBuilder from '../components/QueryBuilder.vue';

const route = useRoute();
const router = useRouter();
const connectionId = computed(() => Number(route.params.connectionId));

// 连接数据
const connection = ref<DbConnection | null>(null);

// 可用数据库
const availableDatabases = ref(['test_db', 'information_schema', 'performance_schema']);
const selectedDatabase = ref('test_db');

// 数据库对象
const databaseObjects = ref({
  tables: ['users', 'products', 'orders', 'order_items'],
  views: ['active_users', 'product_inventory'],
  procedures: ['get_user_orders', 'update_inventory']
});

// 标签页状态
const activeTab = ref('query1');
const tabs = ref([
  { title: '查询 1', name: 'query1', content: '' }
]);

// 查询状态
const sqlQuery = ref('SELECT * FROM users LIMIT 10;');
const queryExecuted = ref(false);
const queryResults = ref([]);
const resultColumns = ref([]);
const executionTime = ref(0);

// 保存查询对话框
const showSaveQueryDialog = ref(false);
const saveQueryForm = reactive({
  name: '',
  tags: [] as string[],
  asFavorite: true
});

// SQL 格式化选项
const formatOptions = reactive({
  uppercase: true,
  indentSize: 2
});

// SQL编辑器引用
const sqlEditorRef = ref<InstanceType<typeof SqlEditor> | null>(null);

// 表的列信息
const tableColumns = ref<Record<string, string[]>>({});

// 是否为暗黑模式
const isDarkMode = computed(() => {
  return document.documentElement.classList.contains('dark');
});

// 获取可用标签
const availableTags = computed(() => {
  // 获取全部已有标签
  const queries = queryHistoryService.getQueryHistory();
  const tagSet = new Set<string>();
  
  queries.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet);
});

function executeQuery() {
  // 开始计时
  const startTime = performance.now();
  
  // 在实际应用中，这会将查询发送到服务器
  // 为了演示，我们将生成模拟数据
  setTimeout(() => {
    // 生成模拟列
    resultColumns.value = ['id', 'username', 'email', 'created_at'];
    
    // 生成模拟结果
    queryResults.value = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      created_at: new Date().toISOString().split('T')[0]
    }));
    
    // 设置已执行标志
    queryExecuted.value = true;
    
    // 计算执行时间
    executionTime.value = Math.round(performance.now() - startTime);
    
    // 将查询添加到历史记录
    if (connection.value) {
      queryHistoryService.addQueryToHistory(
        connection.value.id,
        selectedDatabase.value,
        sqlQuery.value,
        executionTime.value,
        queryResults.value.length
      );
    }
  }, 500);
}

function removeTab(targetName: string) {
  const tabs = tabs.value;
  if (activeTab.value === targetName) {
    tabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1];
        if (nextTab) {
          activeTab.value = nextTab.name;
        }
      }
    });
  }
  
  tabs.value = tabs.filter(tab => tab.name !== targetName);
}

function openTable(tableName: string) {
  // 为表生成 SELECT 查询
  sqlQuery.value = `SELECT * FROM ${tableName} LIMIT 100;`;
  
  // 加载表的列信息
  loadTableColumns(tableName);
}

// 从收藏夹或历史记录中加载查询
function loadSavedQuery(sql: string): void {
  sqlQuery.value = sql;
}

function loadDatabaseObjects(dbType: string, dbName: string) {
  // 在实际应用中，这里将从服务器加载数据库对象
  // 这里只是简单模拟不同类型的数据库对象
  switch (dbType) {
    case 'mysql':
      databaseObjects.value = {
        tables: ['users', 'products', 'orders', 'order_items'],
        views: ['active_users', 'product_inventory'],
        procedures: ['get_user_orders', 'update_inventory']
      };
      break;
    case 'postgresql':
      databaseObjects.value = {
        tables: ['users', 'categories', 'items', 'transactions'],
        views: ['user_stats', 'item_inventory'],
        procedures: ['refresh_stats', 'cleanup_old_data']
      };
      break;
    case 'sqlite':
      databaseObjects.value = {
        tables: ['users', 'settings', 'logs'],
        views: ['active_users'],
        procedures: []
      };
      break;
    default:
      databaseObjects.value = {
        tables: [],
        views: [],
        procedures: []
      };
  }
}

// 新建查询
function newQuery() {
  sqlQuery.value = '';
  queryExecuted.value = false;
  
  // 创建新的标签页
  const tabCount = tabs.value.length + 1;
  const newTabName = `query${tabCount}`;
  
  tabs.value.push({
    title: `查询 ${tabCount}`,
    name: newTabName,
    content: ''
  });
  
  // 激活新标签页
  activeTab.value = newTabName;
}

// 保存查询
function saveQuery() {
  if (!connection.value) return;
  
  // 先创建一个历史记录
  const queryItem = queryHistoryService.addQueryToHistory(
    connection.value.id,
    selectedDatabase.value,
    sqlQuery.value,
    0, // 未执行，设置为0毫秒
    0  // 未执行，设置为0行
  );
  
  // 设置名称、标签和收藏状态
  if (saveQueryForm.name) {
    queryHistoryService.setQueryName(queryItem.id, saveQueryForm.name);
  }
  
  if (saveQueryForm.tags.length > 0) {
    saveQueryForm.tags.forEach(tag => {
      queryHistoryService.addTagToQuery(queryItem.id, tag);
    });
  }
  
  if (saveQueryForm.asFavorite) {
    queryHistoryService.setQueryFavorite(queryItem.id, true);
  }
  
  // 关闭对话框并重置表单
  showSaveQueryDialog.value = false;
  saveQueryForm.name = '';
  saveQueryForm.tags = [];
  saveQueryForm.asFavorite = true;
  
  ElMessage.success('查询已保存');
}

// 格式化SQL
function formatSql() {
  // 使用SqlEditor组件的格式化方法
  sqlEditorRef.value?.formatSql();
  
  ElMessage.success('SQL 已格式化');
}

// 导出查询结果
function exportQueryResults(format: string) {
  if (!queryResults.value.length || !resultColumns.value.length) {
    ElMessage.warning('没有可导出的查询结果');
    return;
  }
  
  let content = '';
  let mimeType = '';
  let fileName = `query-result-${new Date().toISOString().slice(0, 10)}`;
  
  switch (format) {
    case 'csv':
      // 处理CSV导出
      // 添加列头
      content = resultColumns.value.join(',') + '\n';
      
      // 添加数据行
      queryResults.value.forEach(row => {
        const rowData = resultColumns.value.map(col => {
          const value = row[col];
          // 处理CSV中的特殊字符（逗号、引号、换行符）
          if (value === null || value === undefined) return '';
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        content += rowData.join(',') + '\n';
      });
      
      mimeType = 'text/csv';
      fileName += '.csv';
      break;
      
    case 'json':
      // 处理JSON导出
      content = JSON.stringify(queryResults.value, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
      break;
      
    case 'sql':
      // 处理SQL INSERT导出
      if (!connection.value) return;
      
      // 使用从查询中推断的表名，或者使用默认名称
      let tableName = 'table_name';
      const fromMatch = sqlQuery.value.match(/FROM\s+([^\s,;()]+)/i);
      if (fromMatch && fromMatch[1]) {
        tableName = fromMatch[1].trim();
      }
      
      // 生成INSERT语句
      content = `-- 生成的SQL INSERT语句\n`;
      content += `-- 数据库: ${connection.value.database}\n`;
      content += `-- 日期: ${new Date().toLocaleString()}\n\n`;
      
      queryResults.value.forEach(row => {
        const columns = resultColumns.value.join(', ');
        const values = resultColumns.value.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          return value;
        }).join(', ');
        
        content += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
      });
      
      mimeType = 'text/plain';
      fileName += '.sql';
      break;
  }
  
  // 创建下载链接
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // 创建并触发下载链接
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success(`查询结果已导出为 ${format.toUpperCase()} 格式`);
}

// 加载表的列信息
function loadTableColumns(tableName: string) {
  // 在实际应用中，这里会从数据库加载列信息
  // 这里模拟一些列数据
  if (!tableColumns.value[tableName]) {
    // 为不同的表生成模拟列
    if (tableName === 'users') {
      tableColumns.value[tableName] = [
        'id', 'username', 'email', 'password', 'created_at', 'updated_at', 'status'
      ];
    } else if (tableName === 'products') {
      tableColumns.value[tableName] = [
        'id', 'name', 'description', 'price', 'stock', 'category_id', 'created_at'
      ];
    } else if (tableName === 'orders') {
      tableColumns.value[tableName] = [
        'id', 'user_id', 'total_amount', 'status', 'created_at', 'shipping_address'
      ];
    } else if (tableName === 'order_items') {
      tableColumns.value[tableName] = [
        'id', 'order_id', 'product_id', 'quantity', 'unit_price'
      ];
    } else {
      // 默认列
      tableColumns.value[tableName] = ['id', 'name', 'created_at'];
    }
  }
}

onMounted(() => {
  // 从本地存储加载连接信息
  const loadedConnection = storageService.getConnection(connectionId.value);
  
  if (loadedConnection) {
    connection.value = loadedConnection;
    selectedDatabase.value = loadedConnection.database;
    
    // 加载该类型数据库的对象结构
    loadDatabaseObjects(loadedConnection.type, loadedConnection.database);
    
    // 加载表的列信息
    databaseObjects.value.tables.forEach(table => {
      loadTableColumns(table);
    });
    
    console.log(`已连接到 ${loadedConnection.name} (${loadedConnection.type})`);
    
    // 检查URL参数是否带有SQL查询
    const sql = route.query.sql;
    if (sql && typeof sql === 'string') {
      sqlQuery.value = decodeURIComponent(sql);
      
      // 如果带有edit参数，则不自动执行查询
      if (!route.query.edit) {
        // 自动执行查询
        executeQuery();
      }
    }
  } else {
    // 找不到连接信息，返回连接列表页面
    ElMessage.error('无法找到连接信息，请重新选择连接');
    router.push('/connections');
  }
});
</script>

<style scoped>
:deep(.el-tabs__header) {
  margin-bottom: 0;
}

.editor-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.dark .editor-textarea :deep(.el-textarea__inner) {
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-color: #2d2d2d;
}
</style> 