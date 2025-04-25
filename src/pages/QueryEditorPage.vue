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
                    <Icon icon="mdi:table" class="mr-1" />
                    <span>表</span>
                  </template>
                  <el-menu-item 
                    v-for="table in databaseObjects.tables" 
                    :key="table" 
                    :index="`table-${table}`"
                    @click="openTable(table)"
                  >
                    {{ table }}
                  </el-menu-item>
                </el-sub-menu>
                
                <el-sub-menu index="views">
                  <template #title>
                    <Icon icon="mdi:eye" class="mr-1" />
                    <span>视图</span>
                  </template>
                  <el-menu-item 
                    v-for="view in databaseObjects.views" 
                    :key="view" 
                    :index="`view-${view}`"
                    @click="openTable(view)"
                  >
                    {{ view }}
                  </el-menu-item>
                </el-sub-menu>
                
                <el-sub-menu index="procedures">
                  <template #title>
                    <Icon icon="mdi:function" class="mr-1" />
                    <span>存储过程</span>
                  </template>
                  <el-menu-item 
                    v-for="proc in databaseObjects.procedures" 
                    :key="proc" 
                    :index="`proc-${proc}`"
                    @click="openProcedure(proc)"
                  >
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
                :table-columns="tableColumns"
                @sql-generated="sqlQuery = $event"
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
                <el-button type="primary" size="small" @click="executeQuery" :loading="isExecutingQuery">
                  <Icon v-if="!isExecutingQuery" icon="mdi:play" class="mr-1" /> {{ isExecutingQuery ? '执行中...' : '执行' }}
                </el-button>
                <el-button size="small" @click="showSaveQueryDialog = true">
                  <Icon icon="mdi:content-save" class="mr-1" /> 保存
                </el-button>
                <el-button size="small" @click="newQuery">
                  <Icon icon="mdi:file-plus" class="mr-1" /> 新建
                </el-button>
              </el-button-group>
              <el-button type="info" plain size="small" class="ml-2" @click="formatSql">
                <Icon icon="mdi:format-align-left" class="mr-1" /> 格式化
              </el-button>
            </div>
            <div>
              <el-select v-model="selectedDatabase" placeholder="选择数据库" size="small">
                <el-option
                  v-for="db in availableDatabases"
                  :key="db"
                  :label="db"
                  :value="db"
                />
              </el-select>
            </div>
          </div>
          
          <!-- 这在实际应用中会是一个代码编辑器，如 Monaco -->
          <div class="flex-1 overflow-hidden">
            <CodeMirrorEditor
              v-model="sqlQuery"
              height="100%"
              :theme="isDarkMode ? 'dark' : 'light'"
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
          
          <!-- 查询错误信息 -->
          <el-alert
            v-if="queryError"
            :title="queryError"
            type="error"
            show-icon
            :closable="true"
            class="mb-3"
          />
          
          <!-- 查询结果表格 -->
          <el-table v-if="queryExecuted" :data="queryResults" border style="width: 100%" height="100%">
            <el-table-column 
              v-for="column in resultColumns" 
              :key="column" 
              :prop="column" 
              :label="column"
              :width="150"
            ></el-table-column>
          </el-table>
          
          <!-- 查询加载中 -->
          <div v-else-if="isExecutingQuery" class="flex justify-center items-center h-64">
            <el-skeleton :rows="5" animated class="w-full" />
          </div>
          
          <!-- 未执行查询 -->
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { databaseService, type DbConnection } from '../services/database'
import { storageService } from '../utils/storage'
import CodeMirrorEditor from '../components/CodeMirrorEditor.vue'
import FavoriteQueries from '../components/FavoriteQueries.vue'
import QueryBuilder from '../components/QueryBuilder.vue'
import { formatSqlQuery } from '../utils/sql-formatter'

// 页面状态
const route = useRoute()
const router = useRouter()
const connectionId = computed(() => Number(route.params.id))
const connection = ref<DbConnection | null>(null)
const selectedDatabase = ref('')
const availableDatabases = ref<string[]>([])

// 查询编辑器状态
const sqlEditorRef = ref(null)
const sqlQuery = ref('')
const isExecutingQuery = ref(false)
const queryExecuted = ref(false)
const queryResults = ref<any[]>([])
const resultColumns = ref<string[]>([])
const executionTime = ref(0)
const queryError = ref('')
const isDarkMode = ref(false)

// 数据库对象状态
const databaseObjects = ref({
  tables: [] as string[],
  views: [] as string[],
  procedures: [] as string[],
  functions: [] as string[],
  triggers: [] as string[]
})
const tableColumns = ref<Record<string, string[]>>({})

// 标签页状态
interface TabItem {
  name: string;
  title: string;
  content?: string;
}

const activeTab = ref('query-1')
const tabs = ref<TabItem[]>([
  { name: 'query-1', title: '查询 1' }
])
let tabCounter = 1

// 保存查询对话框
const showSaveQueryDialog = ref(false)
const saveQueryForm = ref({
  name: '',
  tags: [] as string[],
  asFavorite: false
})
const availableTags = ref([
  '常用', '报表', '导出', '分析', '临时'
])

// 初始化页面
onMounted(async () => {
  // 加载连接信息
  loadConnectionInfo()

  // 检查是否有URL参数中的SQL
  if (route.query.sql) {
    sqlQuery.value = decodeURIComponent(route.query.sql as string)
    await nextTick()
    
    // 如果有autorun参数，自动执行
    if (route.query.autorun === 'true') {
      executeQuery(true)
    }
  }
  
  // 检测暗黑模式
  isDarkMode.value = document.documentElement.classList.contains('dark')
})

// 监听连接变化
watch(connectionId, () => {
  loadConnectionInfo()
})

// 加载连接信息和数据库对象
async function loadConnectionInfo() {
  try {
    // 获取连接信息
    connection.value = databaseService.getConnection(connectionId.value)
    
    if (!connection.value) {
      ElMessage.error('找不到连接信息')
      return
    }
    
    // 设置初始数据库
    selectedDatabase.value = connection.value.database || ''
    
    // 加载数据库列表
    availableDatabases.value = await databaseService.getDatabases(connectionId.value)
    
    // 加载数据库对象
    loadDatabaseObjects()
  } catch (error) {
    console.error('加载连接信息失败:', error)
    ElMessage.error('加载连接信息失败')
  }
}

// 加载数据库对象
async function loadDatabaseObjects() {
  if (!connection.value) return
  
  try {
    const objects = await databaseService.getDatabaseObjects(connectionId.value)
    
    // 将对象按类型分类
    const tables: string[] = []
    const views: string[] = []
    const procedures: string[] = []
    const functions: string[] = []
    
    objects.forEach(obj => {
      if (obj.type === 'table') {
        tables.push(obj.name)
      } else if (obj.type === 'view') {
        views.push(obj.name)
      } else if (obj.type === 'procedure') {
        procedures.push(obj.name)
      } else if (obj.type === 'function') {
        functions.push(obj.name)
      }
    })
    
    databaseObjects.value = {
      tables,
      views,
      procedures,
      functions,
      triggers: [] // 暂不支持触发器
    }
    
    // 加载表结构
    if (databaseObjects.value.tables.length > 0) {
      await loadTableColumns()
    }
  } catch (error) {
    console.error('加载数据库对象失败:', error)
    ElMessage.error('加载数据库对象失败')
  }
}

// 加载表结构
async function loadTableColumns() {
  if (!connection.value) return
  
  try {
    for (const table of databaseObjects.value.tables) {
      const columns = await databaseService.getTableColumns(
        connectionId.value, 
        table
      )
      
      if (columns && columns.length > 0) {
        const columnNames = columns.map((col: any) => col.name)
        tableColumns.value[table] = columnNames
      }
    }
  } catch (error) {
    console.error('加载表结构失败:', error)
  }
}

// 打开表
function openTable(tableName: string) {
  sqlQuery.value = `SELECT * FROM ${tableName} LIMIT 100;`
}

// 打开存储过程
function openProcedure(procName: string) {
  // 根据数据库类型获取查看存储过程定义的SQL
  const dbType = connection.value?.type || 'mysql'
  let sql = ''
  
  if (dbType === 'mysql') {
    sql = `SHOW CREATE PROCEDURE ${procName};`
  } else if (dbType === 'postgresql') {
    sql = `SELECT prosrc FROM pg_proc WHERE proname = '${procName}';`
  } else if (dbType === 'sqlite') {
    sql = `SELECT sql FROM sqlite_master WHERE type='trigger' AND name='${procName}';`
  }
  
  sqlQuery.value = sql
}

// 新建查询标签
function newQuery() {
  tabCounter++
  const newTabName = `query-${tabCounter}`
  const newTab = {
    name: newTabName,
    title: `查询 ${tabCounter}`
  }
  
  tabs.value.push(newTab)
  activeTab.value = newTabName
  sqlQuery.value = ''
  queryExecuted.value = false
  queryResults.value = []
  resultColumns.value = []
  queryError.value = ''
}

// 删除标签
function removeTab(targetName: string) {
  if (tabs.value.length === 1) {
    ElMessage.warning('至少保留一个查询标签')
    return
  }
  
  const currentTabs = tabs.value
  let activeName = activeTab.value

  if (activeName === targetName) {
    currentTabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = currentTabs[index + 1] || currentTabs[index - 1]
        if (nextTab) {
          activeName = nextTab.name
        }
      }
    })
  }
  
  activeTab.value = activeName
  tabs.value = currentTabs.filter(tab => tab.name !== targetName)
}

// 执行SQL查询
async function executeQuery(fromUrl = false) {
  // 重置状态
  queryResults.value = []
  resultColumns.value = []
  queryError.value = ''
  queryExecuted.value = false
  isExecutingQuery.value = true
  
  try {
    // 验证连接
    if (!connection.value) {
      throw new Error('没有活动的数据库连接')
    }
    
    // 验证查询内容
    if (!sqlQuery.value.trim()) {
      throw new Error('请输入SQL查询语句')
    }
    
    // 执行查询
    const result = await databaseService.executeQuery(
      connectionId.value, 
      sqlQuery.value
    )
    
    // 设置结果
    executionTime.value = result.executionTime
    queryExecuted.value = true
    
    if (result.error) {
      queryError.value = result.error
      ElMessage.error(result.error)
      return
    }
    
    if (result.rows && result.rows.length > 0) {
      queryResults.value = result.rows
      resultColumns.value = result.columns
    } else if (result.affectedRows !== undefined) {
      // 非查询语句，显示受影响的行数
      ElMessage.success(`执行成功: ${result.affectedRows} 行受影响`)
    } else {
      // 查询成功但无数据
      queryResults.value = []
      resultColumns.value = result.columns
    }
    
    // 如果是从URL执行的，清除URL参数避免重复执行
    if (fromUrl) {
      router.replace({ 
        path: route.path, 
        query: {} 
      })
    }
  } catch (error: any) {
    console.error('执行查询失败:', error)
    queryError.value = error.message || '执行查询失败'
    ElMessage.error(queryError.value)
  } finally {
    isExecutingQuery.value = false
  }
}

// Format SQL function
// function formatSqlQuery(sql: string, options: { indent?: number; uppercase?: boolean; linesBetweenQueries?: number } = {}): string {
//   // Implementation removed as we're now importing it
// }

// 格式化SQL
function formatSql() {
  try {
    const formatted = formatSqlQuery(sqlQuery.value, {
      indent: 2,
      uppercase: true,
      linesBetweenQueries: 2
    })
    
    sqlQuery.value = formatted
    ElMessage.success('SQL格式化成功')
  } catch (error) {
    console.error('格式化失败:', error)
    ElMessage.error('SQL格式化失败')
  }
}

// 保存查询
function saveQuery() {
  if (!saveQueryForm.value.name) {
    ElMessage.warning('请输入查询名称')
    return
  }
  
  try {
    const query = {
      id: Date.now(),
      name: saveQueryForm.value.name,
      sql: sqlQuery.value,
      tags: saveQueryForm.value.tags,
      isFavorite: saveQueryForm.value.asFavorite,
      createdAt: new Date().toISOString(),
      connectionId: connectionId.value
    }
    
    // 保存到本地存储
    const savedQueries = JSON.parse(localStorage.getItem('saved_queries') || '[]')
    savedQueries.push(query)
    localStorage.setItem('saved_queries', JSON.stringify(savedQueries))
    
    showSaveQueryDialog.value = false
    ElMessage.success('查询已保存')
    
    // 重置表单
    saveQueryForm.value = {
      name: '',
      tags: [],
      asFavorite: false
    }
  } catch (error) {
    console.error('保存查询失败:', error)
    ElMessage.error('保存查询失败')
  }
}

// 加载保存的查询
function loadSavedQuery(query: any) {
  sqlQuery.value = query.sql
}

// 导出查询结果
function exportQueryResults(format: string) {
  if (!queryResults.value.length) {
    ElMessage.warning('没有结果可导出')
    return
  }
  
  try {
    let content = ''
    const fileName = `query-export-${new Date().getTime()}`
    
    if (format === 'csv') {
      // 导出CSV
      const header = resultColumns.value.join(',')
      const rows = queryResults.value.map(row => {
        return resultColumns.value.map(col => {
          // 转义CSV中的特殊字符
          const value = row[col]
          if (value === null || value === undefined) return ''
          const strValue = String(value)
          return strValue.includes(',') ? `"${strValue.replace(/"/g, '""')}"` : strValue
        }).join(',')
      })
      
      content = [header, ...rows].join('\n')
      downloadFile(`${fileName}.csv`, content, 'text/csv')
    } 
    else if (format === 'json') {
      // 导出JSON
      content = JSON.stringify(queryResults.value, null, 2)
      downloadFile(`${fileName}.json`, content, 'application/json')
    } 
    else if (format === 'sql') {
      // 导出SQL INSERT语句
      if (!databaseObjects.value.tables.length) {
        ElMessage.warning('无法确定表名，无法导出INSERT语句')
        return
      }
      
      // 从查询中提取表名
      const tableMatch = sqlQuery.value.match(/FROM\s+([^\s,;()]+)/i)
      const tableName = tableMatch ? tableMatch[1] : 'table_name'
      
      content = queryResults.value.map(row => {
        const columns = resultColumns.value.join(', ')
        const values = resultColumns.value.map(col => {
          const value = row[col]
          if (value === null || value === undefined) return 'NULL'
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
          return value
        }).join(', ')
        
        return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`
      }).join('\n')
      
      downloadFile(`${fileName}.sql`, content, 'text/plain')
    }
    
    ElMessage.success(`导出${format.toUpperCase()}成功`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 下载文件
function downloadFile(fileName: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
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