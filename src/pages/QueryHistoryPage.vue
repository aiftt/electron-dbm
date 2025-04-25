<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <!-- 页面标题和操作按钮 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">查询历史</h1>
        <div class="flex space-x-2">
          <el-button type="primary" plain @click="exportHistory">
            <Icon icon="mdi:file-export" class="mr-1" />
            导出
          </el-button>
          <el-button type="success" plain @click="showImportDialog = true">
            <Icon icon="mdi:file-import" class="mr-1" />
            导入
          </el-button>
          <el-button type="danger" plain @click="showClearHistoryDialog = true" :disabled="filteredHistory.length === 0">
            <Icon icon="mdi:delete-sweep" class="mr-1" />
            清空历史
          </el-button>
        </div>
      </div>
      
      <!-- 筛选工具栏 -->
      <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <el-input
              v-model="filters.sqlQuery"
              placeholder="搜索 SQL 语句..."
              clearable
              prefix-icon="mdi:magnify"
            />
          </div>
          <div>
            <el-select
              v-model="filters.connectionId"
              placeholder="按连接筛选"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="conn in connections"
                :key="conn.id"
                :label="conn.name"
                :value="conn.id"
              />
            </el-select>
          </div>
          <div>
            <el-select
              v-model="filters.tag"
              placeholder="按标签筛选"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>
        </div>
        
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <div>
            <el-radio-group v-model="filters.type" size="small">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="favorites">收藏</el-radio-button>
            </el-radio-group>
          </div>
          
          <div>
            <el-select
              v-model="sortOrder"
              size="small"
              placeholder="排序方式"
              style="width: 180px"
            >
              <el-option label="最新执行在前" value="newest" />
              <el-option label="最旧执行在前" value="oldest" />
              <el-option label="执行时间 (快→慢)" value="fastFirst" />
              <el-option label="执行时间 (慢→快)" value="slowFirst" />
              <el-option label="结果行数 (多→少)" value="moreRows" />
              <el-option label="结果行数 (少→多)" value="lessRows" />
            </el-select>
          </div>
          
          <div class="ml-auto">
            <span class="text-sm text-gray-500">共 {{ filteredHistory.length }} 条记录</span>
          </div>
        </div>
      </div>
      
      <!-- 历史记录列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div v-if="filteredHistory.length > 0">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="item in filteredHistory" :key="item.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
              <div class="flex justify-between items-start">
                <div class="flex items-start">
                  <div class="mr-3 mt-1">
                    <el-button 
                      :type="item.favorite ? 'warning' : 'default'" 
                      :icon="item.favorite ? 'mdi:star' : 'mdi:star-outline'"
                      size="small"
                      circle
                      plain
                      @click="toggleFavorite(item)"
                    />
                  </div>
                  <div>
                    <div class="font-medium text-lg">
                      <span v-if="item.name">{{ item.name }}</span>
                      <span v-else class="text-gray-600 dark:text-gray-400" @click="promptRenameQuery(item)">
                        <span v-if="item.sql.length > 60">{{ item.sql.substring(0, 60) }}...</span>
                        <span v-else>{{ item.sql }}</span>
                      </span>
                    </div>
                    
                    <div class="mt-1 flex items-center space-x-3 text-sm text-gray-500">
                      <span>
                        <Icon icon="mdi:database" class="inline-block mr-1" /> 
                        {{ getConnectionName(item.connectionId) }}
                      </span>
                      <span>
                        <Icon icon="mdi:folder" class="inline-block mr-1" /> 
                        {{ item.database }}
                      </span>
                      <span>
                        <Icon icon="mdi:clock-outline" class="inline-block mr-1" /> 
                        {{ formatDate(item.timestamp) }}
                      </span>
                      <span>
                        <Icon icon="mdi:timer-outline" class="inline-block mr-1" /> 
                        {{ item.duration }}ms
                      </span>
                      <span v-if="item.rowCount !== undefined">
                        <Icon icon="mdi:table-row" class="inline-block mr-1" /> 
                        {{ item.rowCount }} 行
                      </span>
                    </div>
                    
                    <!-- 标签 -->
                    <div class="mt-2" v-if="item.tags && item.tags.length > 0">
                      <el-tag 
                        v-for="tag in item.tags" 
                        :key="tag" 
                        size="small" 
                        class="mr-1"
                        closable
                        @close="removeTag(item.id, tag)"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-button 
                        size="small" 
                        text
                        @click="showAddTagDialog(item)"
                      >
                        <Icon icon="mdi:plus" /> 添加标签
                      </el-button>
                    </div>
                    <div class="mt-2" v-else>
                      <el-button 
                        size="small" 
                        text
                        @click="showAddTagDialog(item)"
                      >
                        <Icon icon="mdi:tag-plus" /> 添加标签
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <div class="flex space-x-2">
                  <el-tooltip content="重新执行查询">
                    <el-button 
                      type="primary" 
                      size="small" 
                      circle 
                      plain
                      @click="executeQuery(item)"
                    >
                      <Icon icon="mdi:play" />
                    </el-button>
                  </el-tooltip>
                  
                  <el-tooltip content="编辑查询">
                    <el-button 
                      type="success" 
                      size="small" 
                      circle 
                      plain
                      @click="editQuery(item)"
                    >
                      <Icon icon="mdi:pencil" />
                    </el-button>
                  </el-tooltip>
                  
                  <el-dropdown trigger="click">
                    <el-button 
                      size="small" 
                      circle 
                      plain
                    >
                      <Icon icon="mdi:dots-vertical" />
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="promptRenameQuery(item)">
                          <Icon icon="mdi:rename" class="mr-2" /> 重命名
                        </el-dropdown-item>
                        <el-dropdown-item @click="copyQueryToClipboard(item)">
                          <Icon icon="mdi:content-copy" class="mr-2" /> 复制 SQL
                        </el-dropdown-item>
                        <el-dropdown-item divided @click="confirmDeleteQuery(item)">
                          <Icon icon="mdi:delete" class="mr-2 text-red-500" /> 删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <!-- SQL 代码预览 -->
              <div class="mt-3">
                <pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 text-sm overflow-x-auto">{{ item.sql }}</pre>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="p-8 text-center">
          <el-empty :description="getEmptyMessage()">
            <el-button type="primary" @click="goToQueryEditor" v-if="isFilterActive">
              清除筛选
            </el-button>
            <el-button type="primary" @click="goToQueryEditor" v-else>
              开始查询
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>
    
    <!-- 重命名查询对话框 -->
    <el-dialog
      v-model="showRenameDialog"
      title="重命名查询"
      width="400px"
    >
      <div v-if="selectedQuery">
        <el-input v-model="renameForm.name" placeholder="输入查询名称..." />
        <div class="mt-2 text-sm text-gray-500">
          自定义名称可帮助您更快地识别常用查询。
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRenameDialog = false">取消</el-button>
          <el-button type="primary" @click="renameQuery">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加标签对话框 -->
    <el-dialog
      v-model="showTagDialog"
      title="添加标签"
      width="400px"
    >
      <div v-if="selectedQuery">
        <el-select
          v-if="availableTags.length > 0"
          v-model="tagForm.selectedTag"
          placeholder="选择现有标签"
          style="width: 100%; margin-bottom: 10px;"
          filterable
          allow-create
          clearable
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        
        <el-input v-else v-model="tagForm.newTag" placeholder="新标签名称..." />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTagDialog = false">取消</el-button>
          <el-button type="primary" @click="addTag">添加</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="删除查询历史"
      width="400px"
    >
      <p>确定要删除此查询记录吗？</p>
      <p class="text-gray-500 text-sm mt-2">此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">取消</el-button>
          <el-button type="danger" @click="deleteQuery">删除</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 清空历史确认对话框 -->
    <el-dialog
      v-model="showClearHistoryDialog"
      title="清空历史记录"
      width="400px"
    >
      <p>确定要清空所有查询历史吗？</p>
      <div class="mt-4">
        <el-checkbox v-model="keepFavorites">保留收藏的查询</el-checkbox>
      </div>
      <p class="text-gray-500 text-sm mt-2">此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showClearHistoryDialog = false">取消</el-button>
          <el-button type="danger" @click="clearHistory">清空</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入历史记录对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入查询历史"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".json"
      >
        <Icon icon="mdi:file-upload" class="text-3xl text-gray-400" />
        <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip text-center">
            仅支持 .json 文件
          </div>
        </template>
      </el-upload>
      
      <div class="mt-4">
        <el-checkbox v-model="replaceExistingHistory">替换现有历史记录</el-checkbox>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" @click="importHistory" :disabled="!importFile">导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ElMessage } from 'element-plus';
import { queryHistoryService, type QueryHistoryItem } from '../services/query-history';
import { storageService, type DbConnection } from '../utils/storage';

const router = useRouter();

// 数据
const history = ref<QueryHistoryItem[]>([]);
const connections = ref<DbConnection[]>([]);

// 筛选条件
const filters = reactive({
  type: 'all', // 'all' 或 'favorites'
  sqlQuery: '',
  connectionId: undefined as number | undefined,
  tag: undefined as string | undefined
});

// 排序方式
const sortOrder = ref('newest');

// 对话框状态
const showRenameDialog = ref(false);
const showTagDialog = ref(false);
const showDeleteDialog = ref(false);
const showClearHistoryDialog = ref(false);
const showImportDialog = ref(false);

// 表单数据
const selectedQuery = ref<QueryHistoryItem | null>(null);
const renameForm = reactive({
  name: ''
});
const tagForm = reactive({
  newTag: '',
  selectedTag: ''
});
const keepFavorites = ref(true);
const importFile = ref<File | null>(null);
const replaceExistingHistory = ref(false);

// 计算属性：筛选后的历史记录
const filteredHistory = computed(() => {
  let result = history.value;
  
  // 按类型筛选
  if (filters.type === 'favorites') {
    result = result.filter(item => item.favorite);
  }
  
  // 按 SQL 内容筛选
  if (filters.sqlQuery) {
    const query = filters.sqlQuery.toLowerCase();
    result = result.filter(item => 
      (item.sql && item.sql.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query))
    );
  }
  
  // 按连接筛选
  if (filters.connectionId !== undefined) {
    result = result.filter(item => item.connectionId === filters.connectionId);
  }
  
  // 按标签筛选
  if (filters.tag) {
    result = result.filter(item => 
      item.tags && item.tags.includes(filters.tag!)
    );
  }
  
  // 排序
  result = [...result]; // 创建副本进行排序
  switch (sortOrder.value) {
    case 'newest':
      result.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case 'oldest':
      result.sort((a, b) => a.timestamp - b.timestamp);
      break;
    case 'fastFirst':
      result.sort((a, b) => a.duration - b.duration);
      break;
    case 'slowFirst':
      result.sort((a, b) => b.duration - a.duration);
      break;
    case 'moreRows':
      result.sort((a, b) => (b.rowCount || 0) - (a.rowCount || 0));
      break;
    case 'lessRows':
      result.sort((a, b) => (a.rowCount || 0) - (b.rowCount || 0));
      break;
  }
  
  return result;
});

// 计算属性：是否有筛选条件激活
const isFilterActive = computed(() => {
  return (
    filters.type !== 'all' ||
    filters.sqlQuery !== '' ||
    filters.connectionId !== undefined ||
    filters.tag !== undefined
  );
});

// 计算属性：所有可用标签
const availableTags = computed(() => {
  const tagSet = new Set<string>();
  
  history.value.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet).sort();
});

// 方法：获取连接名称
function getConnectionName(connectionId: number): string {
  const connection = connections.value.find(conn => conn.id === connectionId);
  return connection ? connection.name : '未知连接';
}

// 方法：格式化日期
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 方法：切换收藏状态
function toggleFavorite(item: QueryHistoryItem): void {
  const newState = !item.favorite;
  
  if (queryHistoryService.setQueryFavorite(item.id, newState)) {
    item.favorite = newState;
    ElMessage.success(newState ? '已添加到收藏' : '已从收藏中移除');
  }
}

// 方法：显示重命名对话框
function promptRenameQuery(item: QueryHistoryItem): void {
  selectedQuery.value = item;
  renameForm.name = item.name || '';
  showRenameDialog.value = true;
}

// 方法：重命名查询
function renameQuery(): void {
  if (selectedQuery.value) {
    if (queryHistoryService.setQueryName(selectedQuery.value.id, renameForm.name)) {
      selectedQuery.value.name = renameForm.name;
      ElMessage.success('查询已重命名');
    }
  }
  
  showRenameDialog.value = false;
}

// 方法：显示添加标签对话框
function showAddTagDialog(item: QueryHistoryItem): void {
  selectedQuery.value = item;
  tagForm.newTag = '';
  tagForm.selectedTag = '';
  showTagDialog.value = true;
}

// 方法：添加标签
function addTag(): void {
  if (selectedQuery.value) {
    const tag = tagForm.selectedTag || tagForm.newTag;
    
    if (!tag) {
      ElMessage.warning('请输入标签名称');
      return;
    }
    
    if (queryHistoryService.addTagToQuery(selectedQuery.value.id, tag)) {
      // 确保查询有 tags 数组
      if (!selectedQuery.value.tags) {
        selectedQuery.value.tags = [];
      }
      
      // 如果标签不存在才添加
      if (!selectedQuery.value.tags.includes(tag)) {
        selectedQuery.value.tags.push(tag);
      }
      
      ElMessage.success(`标签 "${tag}" 已添加`);
    }
  }
  
  showTagDialog.value = false;
}

// 方法：移除标签
function removeTag(queryId: string, tag: string): void {
  const query = history.value.find(item => item.id === queryId);
  
  if (query && queryHistoryService.removeTagFromQuery(queryId, tag)) {
    // 从界面上移除标签
    if (query.tags) {
      const index = query.tags.indexOf(tag);
      if (index !== -1) {
        query.tags.splice(index, 1);
      }
    }
    
    ElMessage.success(`标签 "${tag}" 已移除`);
  }
}

// 方法：执行查询
function executeQuery(item: QueryHistoryItem): void {
  // 打开查询编辑器并将SQL加载到编辑器中
  router.push({
    path: `/query/${item.connectionId}`,
    query: { sql: encodeURIComponent(item.sql) }
  });
}

// 方法：编辑查询
function editQuery(item: QueryHistoryItem): void {
  // 打开查询编辑器并将SQL加载到编辑器中
  router.push({
    path: `/query/${item.connectionId}`,
    query: { sql: encodeURIComponent(item.sql), edit: 'true' }
  });
}

// 方法：确认删除查询
function confirmDeleteQuery(item: QueryHistoryItem): void {
  selectedQuery.value = item;
  showDeleteDialog.value = true;
}

// 方法：删除查询
function deleteQuery(): void {
  if (selectedQuery.value) {
    if (queryHistoryService.deleteQuery(selectedQuery.value.id)) {
      // 从本地列表中移除
      history.value = history.value.filter(item => item.id !== selectedQuery.value!.id);
      ElMessage.success('查询已删除');
    }
  }
  
  showDeleteDialog.value = false;
}

// 方法：复制 SQL 到剪贴板
function copyQueryToClipboard(item: QueryHistoryItem): void {
  navigator.clipboard.writeText(item.sql)
    .then(() => {
      ElMessage.success('SQL 已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
}

// 方法：清空历史记录
function clearHistory(): void {
  queryHistoryService.clearHistory(keepFavorites.value);
  
  // 重新加载历史记录
  history.value = queryHistoryService.getQueryHistory();
  
  showClearHistoryDialog.value = false;
  ElMessage.success(keepFavorites.value ? '非收藏历史记录已清空' : '所有历史记录已清空');
}

// 方法：导出历史记录
function exportHistory(): void {
  // 准备导出数据
  const jsonData = queryHistoryService.exportHistory(false);
  
  // 创建下载链接
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // 创建并触发下载链接
  const link = document.createElement('a');
  link.href = url;
  link.download = `query-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success('历史记录已导出');
}

// 方法：处理文件上传
function handleFileChange(file: any): void {
  importFile.value = file.raw;
}

// 方法：导入历史记录
function importHistory(): void {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const count = queryHistoryService.importHistory(result, replaceExistingHistory.value);
        
        // 重新加载历史记录
        history.value = queryHistoryService.getQueryHistory();
        
        ElMessage.success(`成功导入 ${count} 条历史记录`);
        showImportDialog.value = false;
      }
    } catch (error) {
      ElMessage.error(`导入失败：${(error as Error).message}`);
    }
  };
  
  reader.readAsText(importFile.value);
}

// 方法：获取空结果消息
function getEmptyMessage(): string {
  if (isFilterActive.value) {
    return '没有符合条件的查询历史';
  } else {
    return '没有查询历史记录';
  }
}

// 方法：前往查询编辑器
function goToQueryEditor(): void {
  if (isFilterActive.value) {
    // 清除筛选
    filters.type = 'all';
    filters.sqlQuery = '';
    filters.connectionId = undefined;
    filters.tag = undefined;
  } else {
    // 如果有连接则打开第一个连接的查询编辑器
    if (connections.value.length > 0) {
      router.push(`/query/${connections.value[0].id}`);
    } else {
      // 否则跳转到连接管理页面
      router.push('/connections');
    }
  }
}

// 页面加载时从本地存储加载数据
onMounted(() => {
  history.value = queryHistoryService.getQueryHistory();
  connections.value = storageService.loadConnections();
});
</script> 