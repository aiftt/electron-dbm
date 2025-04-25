<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 表格标题 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">表：{{ table }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            数据库：{{ database }}
          </p>
        </div>
        <div class="flex gap-2">
          <el-button-group>
            <el-button size="small" @click="refreshData">
              <Icon icon="mdi:refresh" class="mr-1" /> 刷新
            </el-button>
            <el-button size="small" @click="showInsertDialog = true">
              <Icon icon="mdi:plus" class="mr-1" /> 新增记录
            </el-button>
            <el-button size="small" @click="showStructureDialog = true">
              <Icon icon="mdi:information-outline" class="mr-1" /> 表结构
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
    
    <!-- 表格标签栏 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="数据" name="data"></el-tab-pane>
        <el-tab-pane label="结构" name="structure"></el-tab-pane>
        <el-tab-pane label="索引" name="indexes"></el-tab-pane>
        <el-tab-pane label="外键" name="foreign-keys"></el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 表格内容 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 数据标签页 -->
      <div v-if="activeTab === 'data'" class="h-full flex flex-col">
        <!-- 筛选和分页 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-2 items-center">
            <el-input
              v-model="filter"
              placeholder="搜索记录..."
              prefix-icon="el-icon-search"
              size="small"
              class="w-64"
            ></el-input>
            <el-button size="small" @click="applyFilter">应用</el-button>
          </div>
          
          <el-pagination
            layout="prev, pager, next"
            :total="totalRows"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handlePageChange"
          ></el-pagination>
        </div>
        
        <!-- 表格数据 -->
        <div class="flex-1 overflow-auto">
          <el-table
            :data="tableData"
            border
            style="width: 100%"
            height="100%"
            @row-click="handleRowClick"
          >
            <!-- 操作列 -->
            <el-table-column fixed="left" label="操作" width="120">
              <template #default="scope">
                <el-button-group>
                  <el-button
                    size="small"
                    type="primary"
                    @click.stop="editRow(scope.row)"
                    circle
                  >
                    <Icon icon="mdi:pencil" />
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="confirmDeleteRow(scope.row)"
                    circle
                  >
                    <Icon icon="mdi:delete" />
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
            
            <!-- 根据表结构生成的动态列 -->
            <el-table-column
              v-for="column in tableColumns"
              :key="column.name"
              :prop="column.name"
              :label="column.name"
              :width="column.type.includes('varchar') ? 200 : 150"
            >
              <template #default="scope">
                <span :class="{ 'text-gray-400': scope.row[column.name] === null }">
                  {{ formatColumnValue(scope.row[column.name], column.type) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <!-- 结构标签页 -->
      <div v-else-if="activeTab === 'structure'">
        <el-table :data="tableColumns" border style="width: 100%">
          <el-table-column prop="name" label="列名" width="200"></el-table-column>
          <el-table-column prop="type" label="数据类型" width="200"></el-table-column>
          <el-table-column prop="nullable" label="允许空值" width="100">
            <template #default="scope">
              {{ scope.row.nullable ? '是' : '否' }}
            </template>
          </el-table-column>
          <el-table-column prop="key" label="键类型" width="100"></el-table-column>
          <el-table-column prop="default" label="默认值" width="150">
            <template #default="scope">
              <span :class="{ 'text-gray-400': scope.row.default === null }">
                {{ scope.row.default === null ? 'NULL' : scope.row.default }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="extra" label="额外信息" width="150"></el-table-column>
        </el-table>
      </div>
      
      <!-- 其他标签页类似方式实现 -->
      <div v-else class="p-4">
        <el-empty :description="`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 内容即将推出`"></el-empty>
      </div>
    </div>
    
    <!-- 编辑行对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑行" width="700px">
      <el-form :model="editForm" label-width="150px">
        <el-form-item v-for="column in tableColumns" :key="column.name" :label="column.name">
          <el-input v-model="editForm[column.name]" :disabled="column.key === 'PRI'"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="saveRow">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 插入行对话框 -->
    <el-dialog v-model="showInsertDialog" title="插入行" width="700px">
      <el-form :model="insertForm" label-width="150px">
        <el-form-item v-for="column in tableColumns" :key="column.name" :label="column.name">
          <el-input 
            v-model="insertForm[column.name]" 
            :disabled="column.extra === 'auto_increment'"
            :placeholder="column.nullable ? 'NULL' : ''"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showInsertDialog = false">取消</el-button>
          <el-button type="primary" @click="insertRow">插入</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteConfirmation"
      title="删除行"
      width="400px"
    >
      <p>确定要删除这一行吗？</p>
      <p class="text-gray-500 text-sm mt-2">此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirmation = false">取消</el-button>
          <el-button type="danger" @click="deleteRow">删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';

const route = useRoute();
const connectionId = computed(() => Number(route.params.connectionId));
const database = computed(() => route.params.database as string);
const table = computed(() => route.params.table as string);

// 连接信息（在实际应用中会从 store 中获取）
const connectionName = ref('本地 MySQL');

// 标签页状态
const activeTab = ref('data');

// 表格数据状态
interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  default: string | null;
  extra: string;
}

interface TableRow {
  [key: string]: any;
  id: number;
}

const tableData = ref<TableRow[]>([]);
const tableColumns = ref<TableColumn[]>([]);
const totalRows = ref(100);
const pageSize = ref(25);
const currentPage = ref(1);
const filter = ref('');

// 对话框
const showEditDialog = ref(false);
const showInsertDialog = ref(false);
const showStructureDialog = ref(false);
const showDeleteConfirmation = ref(false);
const editForm = reactive<Record<string, any>>({});
const insertForm = reactive<Record<string, any>>({});
const selectedRow = ref<TableRow | null>(null);

function refreshData() {
  // 在实际应用中，这会从服务器获取数据
  // 为了演示，我们将生成模拟数据
  loadMockData();
}

function loadMockData() {
  // 生成模拟列
  tableColumns.value = [
    { name: 'id', type: 'int(11)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment' },
    { name: 'username', type: 'varchar(50)', nullable: false, key: 'UNI', default: null, extra: '' },
    { name: 'email', type: 'varchar(100)', nullable: false, key: 'UNI', default: null, extra: '' },
    { name: 'full_name', type: 'varchar(100)', nullable: true, key: '', default: null, extra: '' },
    { name: 'active', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '' },
    { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
    { name: 'updated_at', type: 'datetime', nullable: true, key: '', default: null, extra: '' },
  ];
  
  // 生成模拟数据
  tableData.value = Array.from({ length: pageSize.value }, (_, i) => {
    const id = (currentPage.value - 1) * pageSize.value + i + 1;
    return {
      id: id,
      username: `user${id}`,
      email: `user${id}@example.com`,
      full_name: `用户 ${id}`,
      active: Math.random() > 0.2 ? 1 : 0,
      created_at: '2023-01-01 12:00:00',
      updated_at: Math.random() > 0.5 ? '2023-02-15 15:30:00' : null,
    };
  });
}

function handlePageChange(page: number) {
  currentPage.value = page;
  refreshData();
}

function applyFilter() {
  // 在实际应用中，这会基于筛选值过滤数据
  console.log(`筛选条件: ${filter.value}`);
  currentPage.value = 1;
  refreshData();
}

function handleRowClick(row: any) {
  console.log('行点击:', row);
}

function editRow(row: TableRow) {
  selectedRow.value = { ...row };
  Object.keys(row).forEach(key => {
    editForm[key] = row[key];
  });
  showEditDialog.value = true;
}

function saveRow() {
  // 在实际应用中，这会调用API保存数据
  if (!editForm.id) {
    console.error('Missing ID in edit form');
    return;
  }
  
  console.log('保存行:', editForm);
  // 更新表格中的行
  const index = tableData.value.findIndex(r => r.id === editForm.id);
  if (index !== -1) {
    tableData.value[index] = { ...editForm as TableRow };
  }
  
  showEditDialog.value = false;
}

function confirmDeleteRow(row: TableRow) {
  selectedRow.value = { ...row };
  showDeleteConfirmation.value = true;
}

function deleteRow() {
  if (!selectedRow.value) return;
  
  // 在实际应用中，这会调用API删除数据
  const id = selectedRow.value.id;
  tableData.value = tableData.value.filter(r => r.id !== id);
  
  showDeleteConfirmation.value = false;
  selectedRow.value = null;
}

function insertRow() {
  // 在实际应用中，这会向数据库插入新行
  console.log('插入行:', insertForm);
  // 将行添加到表格
  const newId = Math.max(...tableData.value.map(r => r.id)) + 1;
  tableData.value.unshift({ ...insertForm, id: newId });
  showInsertDialog.value = false;
  // 重置表单
  Object.keys(insertForm).forEach(key => delete insertForm[key]);
}

function formatColumnValue(value: any, type: string): any {
  if (value === null) return 'NULL';
  
  // 根据列类型格式化值
  if (type.includes('datetime')) {
    return new Date(value).toLocaleString();
  } else if (type.includes('date')) {
    return new Date(value).toLocaleDateString();
  } else if (type.includes('tinyint') && (value === 0 || value === 1)) {
    return value === 1 ? '是' : '否';
  }
  
  return value;
}

onMounted(() => {
  console.log(`加载表 ${database.value}.${table.value}，连接 ID ${connectionId.value}`);
  loadMockData();
  
  // 用空值初始化插入表单
  tableColumns.value.forEach(column => {
    insertForm[column.name] = '';
  });
});
</script> 