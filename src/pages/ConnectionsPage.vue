<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <!-- 页面标题和操作按钮 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">数据库连接</h1>
        <div class="flex space-x-2">
          <el-dropdown split-button type="primary" @click="showNewConnectionDialog = true">
            <template #default>
              <Icon icon="mdi:database-plus" class="mr-1" />
              新建连接
            </template>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="importConnections">
                  <Icon icon="mdi:database-import" class="mr-2" /> 导入连接
                </el-dropdown-item>
                <el-dropdown-item @click="exportConnections" :disabled="!connections.length">
                  <Icon icon="mdi:database-export" class="mr-2" /> 导出连接
                </el-dropdown-item>
                <el-dropdown-item @click="showGroupManager = true">
                  <Icon icon="mdi:folder-multiple" class="mr-2" /> 管理分组
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 分组标签页 -->
      <el-tabs v-model="activeGroup" type="card" class="mb-4">
        <el-tab-pane label="全部连接" name="all"></el-tab-pane>
        <el-tab-pane 
          v-for="group in connectionGroups" 
          :key="group.id" 
          :label="group.name" 
          :name="group.id"
        >
          <template #label>
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: group.color }"></div>
              {{ group.name }}
              <span class="ml-1 text-xs text-gray-500">({{ getConnectionsInGroup(group.name).length }})</span>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 连接卡片列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-if="filteredConnections.length">
          <div v-for="connection in filteredConnections" :key="connection.id" class="card">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 class="font-medium">{{ connection.name }}</h3>
              <el-dropdown>
                <el-button link>
                  <Icon icon="mdi:dots-vertical" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openQueryEditor(connection.id)">
                      <Icon icon="mdi:code-braces" class="mr-2" /> 查询
                    </el-dropdown-item>
                    <el-dropdown-item @click="editConnection(connection)">
                      <Icon icon="mdi:pencil" class="mr-2" /> 编辑
                    </el-dropdown-item>
                    <el-dropdown-item @click="duplicateConnection(connection)">
                      <Icon icon="mdi:content-duplicate" class="mr-2" /> 复制
                    </el-dropdown-item>
                    <el-dropdown-item @click="showMoveConnectionDialog(connection)">
                      <Icon icon="mdi:folder-move" class="mr-2" /> 移动分组
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="confirmDeleteConnection(connection)">
                      <Icon icon="mdi:delete" class="mr-2 text-red-500" /> 删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="p-4">
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">类型：</span>
                {{ connection.type }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">主机：</span>
                {{ connection.host || 'localhost' }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">数据库：</span>
                {{ connection.database }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">分组：</span>
                {{ connection.group || '默认' }}
              </div>
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-700 flex items-center space-x-2">
              <el-button plain size="small" @click="testConnection(connection)" :loading="testingConnection === connection.id">测试</el-button>
              <el-button type="primary" plain size="small" @click="openQueryEditor(connection.id)">
                连接
              </el-button>
            </div>
          </div>
        </template>
        
        <div v-else class="col-span-full">
          <el-empty :description="activeGroup === 'all' ? '未找到连接' : '此分组中没有连接'">
            <el-button type="primary" @click="showNewConnectionDialog = true">
              创建连接
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>
    
    <!-- 新建/编辑连接对话框 -->
    <el-dialog
      v-model="showNewConnectionDialog"
      :title="isEditingConnection ? '编辑连接' : '新建连接'"
      width="500px"
    >
      <el-form :model="connectionForm" label-width="120px">
        <el-form-item label="名称">
          <el-input v-model="connectionForm.name" placeholder="我的连接" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="connectionForm.type" placeholder="选择数据库类型" style="width: 100%">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="SQLite" value="sqlite" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机" v-if="connectionForm.type !== 'sqlite'">
          <el-input v-model="connectionForm.host" placeholder="localhost" />
        </el-form-item>
        <el-form-item label="端口" v-if="connectionForm.type !== 'sqlite'">
          <el-input-number v-model="connectionForm.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="数据库">
          <el-input v-model="connectionForm.database" placeholder="mydatabase" />
        </el-form-item>
        <el-form-item label="用户名" v-if="connectionForm.type !== 'sqlite'">
          <el-input v-model="connectionForm.username" placeholder="root" />
        </el-form-item>
        <el-form-item label="密码" v-if="connectionForm.type !== 'sqlite'">
          <el-input v-model="connectionForm.password" type="password" placeholder="********" />
        </el-form-item>
        <el-form-item label="SSL连接" v-if="connectionForm.type !== 'sqlite'">
          <el-switch v-model="connectionForm.useSSL" />
        </el-form-item>
        <el-form-item label="连接超时">
          <el-input-number v-model="connectionForm.timeout" :min="1000" :max="60000" :step="1000" style="width: 100%" />
          <div class="text-xs text-gray-500 mt-1">毫秒 (1000ms = 1秒)</div>
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="connectionForm.group" placeholder="选择分组" style="width: 100%">
            <el-option v-for="group in connectionGroups" :key="group.id" :label="group.name" :value="group.name">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: group.color }"></div>
                {{ group.name }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showNewConnectionDialog = false">取消</el-button>
          <el-button type="primary" @click="saveConnection">保存</el-button>
          <el-button type="success" v-if="!isEditingConnection" @click="saveAndConnect">保存并连接</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteConfirmation"
      title="删除连接"
      width="400px"
    >
      <p>确定要删除此连接吗？</p>
      <p class="text-gray-500 text-sm mt-2">此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirmation = false">取消</el-button>
          <el-button type="danger" @click="deleteConnection">删除</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 连接测试结果对话框 -->
    <el-dialog
      v-model="showTestResult"
      :title="testResult.success ? '连接成功' : '连接失败'"
      width="500px"
    >
      <div class="flex mb-4">
        <div class="mr-4">
          <Icon v-if="testResult.success" icon="mdi:check-circle" class="text-green-500 text-3xl" />
          <Icon v-else icon="mdi:alert-circle" class="text-red-500 text-3xl" />
        </div>
        <div class="flex-1">
          <p class="font-medium">{{ testResult.message }}</p>
          <p v-if="testResult.details" class="text-sm text-gray-500 mt-1">{{ testResult.details }}</p>
        </div>
      </div>
      
      <!-- 服务器信息 -->
      <div v-if="testResult.success && testResult.serverInfo" class="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
        <h4 class="text-sm font-medium mb-2">服务器信息</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">版本:</span> 
            {{ testResult.serverInfo.version }}
          </div>
          <div>
            <span class="text-gray-500">平台:</span> 
            {{ testResult.serverInfo.platform }}
          </div>
          <div>
            <span class="text-gray-500">连接ID:</span> 
            {{ testResult.serverInfo.connectionId }}
          </div>
          <div>
            <span class="text-gray-500">字符集:</span> 
            {{ testResult.serverInfo.charset }}
          </div>
          <div>
            <span class="text-gray-500">时区:</span> 
            {{ testResult.serverInfo.timezone }}
          </div>
        </div>
      </div>
      
      <!-- 连接耗时 -->
      <div v-if="testResult.timing" class="mt-4 text-sm text-gray-500">
        <p>连接耗时: {{ testResult.timing.connect }}ms</p>
        <p v-if="testResult.timing.query">查询耗时: {{ testResult.timing.query }}ms</p>
        <p>总耗时: {{ testResult.timing.total }}ms</p>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="showTestResult = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 移动连接对话框 -->
    <el-dialog
      v-model="showMoveDialog"
      title="移动连接到分组"
      width="400px"
    >
      <div v-if="connectionToMove">
        <p class="mb-4">将连接 "{{ connectionToMove.name }}" 移动到:</p>
        <el-radio-group v-model="targetGroupId" class="flex flex-col space-y-3">
          <el-radio 
            v-for="group in connectionGroups" 
            :key="group.id" 
            :value="group.id"
            border
          >
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: group.color }"></div>
              {{ group.name }}
            </div>
          </el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMoveDialog = false">取消</el-button>
          <el-button type="primary" @click="moveConnection">移动</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 分组管理对话框 -->
    <el-dialog
      v-model="showGroupManager"
      title="管理连接分组"
      width="600px"
    >
      <ConnectionGroupManager @update:groups="updateConnectionGroups" />
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="showGroupManager = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入连接对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入连接"
      width="500px"
    >
      <div>
        <p class="mb-4">请粘贴包含连接配置的JSON内容：</p>
        <el-input
          v-model="importJson"
          type="textarea"
          :rows="10"
          placeholder="在此粘贴JSON内容..."
        ></el-input>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmImport">导入</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导出连接对话框 -->
    <el-dialog
      v-model="showExportDialog"
      title="导出连接"
      width="500px"
    >
      <div>
        <div class="mb-4">
          <el-checkbox v-model="exportWithPasswords">包含密码（不安全）</el-checkbox>
          <p class="text-xs text-gray-500 mt-1">
            警告：包含密码的导出文件包含敏感信息，请谨慎处理和共享。
          </p>
        </div>
        
        <el-input
          v-model="exportJson"
          type="textarea"
          :rows="10"
          readonly
        ></el-input>
        
        <div class="mt-4">
          <el-button type="primary" size="small" @click="copyExportJson" class="mr-2">
            <Icon icon="mdi:content-copy" class="mr-1" /> 复制到剪贴板
          </el-button>
          <el-button type="success" size="small" @click="downloadExportJson">
            <Icon icon="mdi:download" class="mr-1" /> 下载文件
          </el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showExportDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ElMessage } from 'element-plus';
import { databaseService, type DbConnection, type ConnectionTestResult } from '../services/database';
import { storageService, type ConnectionGroup } from '../utils/storage';
import ConnectionGroupManager from '../components/ConnectionGroupManager.vue';

const router = useRouter();

// 连接数据
const connections = ref<DbConnection[]>([]);
const connectionGroups = ref<ConnectionGroup[]>([]);
const activeGroup = ref('all');

// 过滤后的连接列表
const filteredConnections = computed(() => {
  if (activeGroup.value === 'all') {
    return connections.value;
  }
  
  const groupName = getGroupNameById(activeGroup.value);
  return connections.value.filter(conn => conn.group === groupName);
});

// 对话框状态
const showNewConnectionDialog = ref(false);
const showDeleteConfirmation = ref(false);
const showTestResult = ref(false);
const showMoveDialog = ref(false);
const showGroupManager = ref(false);
const showImportDialog = ref(false);
const showExportDialog = ref(false);

// 编辑状态
const isEditingConnection = ref(false);
const connectionToDelete = ref<DbConnection | null>(null);
const connectionToMove = ref<DbConnection | null>(null);
const targetGroupId = ref('');

// 连接测试状态
const testingConnection = ref<number | null>(null);
const testResult = reactive<ConnectionTestResult>({
  success: false,
  message: ''
});

// 导入导出状态
const importJson = ref('');
const exportJson = ref('');
const exportWithPasswords = ref(false);

// 连接表单
const connectionForm = reactive<Partial<DbConnection>>({
  id: 0,
  name: '',
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: '',
  username: '',
  password: '',
  timeout: 10000,
  useSSL: false,
  group: '默认'
});

// 监听导出选项变化，更新导出内容
watch(exportWithPasswords, () => {
  updateExportJson();
});

// 初始化表单
function resetConnectionForm() {
  connectionForm.id = 0;
  connectionForm.name = '';
  connectionForm.type = 'mysql';
  connectionForm.host = 'localhost';
  connectionForm.port = 3306;
  connectionForm.database = '';
  connectionForm.username = '';
  connectionForm.password = '';
  connectionForm.timeout = 10000;
  connectionForm.useSSL = false;
  connectionForm.group = '默认';
}

function openQueryEditor(connectionId: number) {
  router.push(`/query/${connectionId}`);
}

function editConnection(connection: DbConnection) {
  isEditingConnection.value = true;
  Object.assign(connectionForm, connection);
  showNewConnectionDialog.value = true;
}

function duplicateConnection(connection: DbConnection) {
  isEditingConnection.value = false;
  const duplicate = { ...connection };
  duplicate.id = undefined as unknown as number;
  duplicate.name = `${duplicate.name} (复制)`;
  Object.assign(connectionForm, duplicate);
  showNewConnectionDialog.value = true;
}

function confirmDeleteConnection(connection: DbConnection) {
  connectionToDelete.value = connection;
  showDeleteConfirmation.value = true;
}

function showMoveConnectionDialog(connection: DbConnection) {
  connectionToMove.value = connection;
  
  // 设置当前分组ID
  const group = connectionGroups.value.find(g => g.name === connection.group);
  targetGroupId.value = group ? group.id : connectionGroups.value[0].id;
  
  showMoveDialog.value = true;
}

function saveConnectionsToStorage() {
  storageService.saveConnections(connections.value);
  // 触发自定义事件以通知其他组件连接已更新
  window.dispatchEvent(new CustomEvent('connections-updated'));
}

function saveConnection() {
  // 表单验证
  if (!connectionForm.name?.trim()) {
    ElMessage.warning('连接名称不能为空');
    return;
  }
  
  if (!connectionForm.database?.trim() && connectionForm.type !== 'sqlite') {
    ElMessage.warning('数据库名称不能为空');
    return;
  }
  
  if (connectionForm.type !== 'sqlite') {
    if (!connectionForm.host?.trim()) {
      ElMessage.warning('主机地址不能为空');
      return;
    }
  }
  
  if (isEditingConnection.value) {
    // 编辑现有连接
    const index = connections.value.findIndex(c => c.id === connectionForm.id);
    if (index !== -1) {
      connections.value[index] = { ...connectionForm as DbConnection };
    }
  } else {
    // 添加新连接
    const newId = connections.value.length > 0 
      ? Math.max(...connections.value.map(c => c.id)) + 1 
      : 1;
    connections.value.push({ ...(connectionForm as any), id: newId });
  }
  
  // 保存到本地存储
  saveConnectionsToStorage();
  
  showNewConnectionDialog.value = false;
  isEditingConnection.value = false;
  resetConnectionForm();
  
  ElMessage.success('连接已保存');
}

function saveAndConnect() {
  // 保存连接
  saveConnection();
  
  // 获取新创建的连接ID
  const lastId = Math.max(...connections.value.map(c => c.id));
  
  // 打开查询编辑器
  if (lastId) {
    openQueryEditor(lastId);
  }
}

function deleteConnection() {
  if (connectionToDelete.value) {
    connections.value = connections.value.filter(c => c.id !== connectionToDelete.value!.id);
    
    // 保存到本地存储
    saveConnectionsToStorage();
    
    showDeleteConfirmation.value = false;
    connectionToDelete.value = null;
    
    ElMessage.success('连接已删除');
  }
}

async function testConnection(connection: DbConnection) {
  try {
    // 设置正在测试的连接 ID
    testingConnection.value = connection.id;
    
    // 调用数据库服务测试连接
    const result = await databaseService.testConnection(connection);
    
    // 保存测试结果
    Object.assign(testResult, result);
    
    // 显示结果对话框
    showTestResult.value = true;
  } catch (error) {
    console.error('测试连接出错:', error);
    
    // 显示错误结果
    Object.assign(testResult, {
      success: false,
      message: '测试连接过程中发生错误',
      details: error instanceof Error ? error.message : String(error)
    });
    
    showTestResult.value = true;
  } finally {
    // 清除正在测试的连接状态
    testingConnection.value = null;
  }
}

function moveConnection() {
  if (!connectionToMove.value || !targetGroupId.value) return;
  
  // 查找目标分组名称
  const targetGroupName = getGroupNameById(targetGroupId.value);
  
  // 更新连接的分组
  const index = connections.value.findIndex(conn => conn.id === connectionToMove.value!.id);
  if (index !== -1) {
    connections.value[index].group = targetGroupName;
    
    // 保存到本地存储
    saveConnectionsToStorage();
    
    ElMessage.success(`已将连接移动到 "${targetGroupName}" 分组`);
  }
  
  // 关闭对话框
  showMoveDialog.value = false;
  connectionToMove.value = null;
}

function getConnectionsInGroup(groupName: string): DbConnection[] {
  return connections.value.filter(conn => conn.group === groupName);
}

function getGroupNameById(groupId: string): string {
  const group = connectionGroups.value.find(g => g.id === groupId);
  return group ? group.name : '默认';
}

function updateConnectionGroups(groups: ConnectionGroup[]) {
  connectionGroups.value = groups;
}

function importConnections() {
  importJson.value = '';
  showImportDialog.value = true;
}

function confirmImport() {
  if (!importJson.value.trim()) {
    ElMessage.warning('请输入要导入的JSON内容');
    return;
  }
  
  try {
    // 导入连接
    const newConnections = storageService.importConnections(importJson.value);
    
    // 重新加载连接列表
    connections.value = storageService.loadConnections();
    
    // 通知其他组件连接已更新
    window.dispatchEvent(new CustomEvent('connections-updated'));
    
    // 关闭对话框
    showImportDialog.value = false;
    importJson.value = '';
    
    ElMessage.success(`成功导入 ${newConnections.length} 个连接`);
  } catch (error) {
    ElMessage.error(`导入失败: ${error instanceof Error ? error.message : '无效的JSON格式'}`);
  }
}

function exportConnections() {
  // 更新导出内容
  updateExportJson();
  
  // 显示导出对话框
  showExportDialog.value = true;
}

function updateExportJson() {
  // 生成导出内容
  exportJson.value = storageService.exportConnections(connections.value, exportWithPasswords.value);
}

function copyExportJson() {
  navigator.clipboard.writeText(exportJson.value)
    .then(() => {
      ElMessage.success('已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
}

function downloadExportJson() {
  // 创建下载链接
  const blob = new Blob([exportJson.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dbm-connections-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 页面加载时从本地存储加载数据
onMounted(() => {
  connections.value = storageService.loadConnections();
  connectionGroups.value = storageService.loadConnectionGroups();
});
</script> 