<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium mb-2">连接分组管理</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        您可以创建分组来组织数据库连接，使管理更加便捷。
      </p>
      
      <!-- 分组列表 -->
      <div class="space-y-2">
        <div v-for="group in groups" :key="group.id" class="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: group.color }"></div>
            <span class="font-medium">{{ group.name }}</span>
            <span class="text-xs text-gray-500">{{ getConnectionCountInGroup(group.id) }} 个连接</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <el-button 
              type="primary" 
              size="small" 
              circle 
              plain
              @click="editGroup(group)"
            >
              <Icon icon="mdi:pencil" />
            </el-button>
            
            <el-button 
              type="danger" 
              size="small" 
              circle 
              plain
              @click="confirmDeleteGroup(group)"
              :disabled="isDefaultGroup(group) || hasConnections(group.id)"
            >
              <Icon icon="mdi:delete" />
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 添加按钮 -->
      <div class="mt-4">
        <el-button type="primary" @click="showAddGroupDialog = true">
          <Icon icon="mdi:plus" class="mr-1" /> 添加分组
        </el-button>
      </div>
    </div>
    
    <!-- 添加/编辑分组对话框 -->
    <el-dialog
      v-model="showGroupDialog"
      :title="isEditingGroup ? '编辑分组' : '新建分组'"
      width="400px"
    >
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="groupForm.name" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="groupForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="saveGroup">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除分组确认对话框 -->
    <el-dialog
      v-model="showDeleteConfirmation"
      title="删除分组"
      width="400px"
    >
      <p>确定要删除分组 "{{ groupToDelete?.name }}" 吗？</p>
      <p class="text-gray-500 text-sm mt-2">此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirmation = false">取消</el-button>
          <el-button type="danger" @click="deleteGroup">删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineEmits, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { ElMessage } from 'element-plus';
import { storageService, type ConnectionGroup } from '../utils/storage';
import { type DbConnection } from '../services/database';

const emit = defineEmits(['update:groups']);

// 分组数据
const groups = ref<ConnectionGroup[]>([]);
const connections = ref<DbConnection[]>([]);

// 对话框状态
const showGroupDialog = ref(false);
const showAddGroupDialog = ref(false);
const showDeleteConfirmation = ref(false);
const isEditingGroup = ref(false);
const groupToDelete = ref<ConnectionGroup | null>(null);

// 表单数据
const groupForm = reactive<ConnectionGroup>({
  id: '',
  name: '',
  color: '#409EFF',
  expanded: true
});

function resetGroupForm() {
  groupForm.id = '';
  groupForm.name = '';
  groupForm.color = '#409EFF';
  groupForm.expanded = true;
}

// 监听 showAddGroupDialog 变化，打开添加分组对话框
watch(showAddGroupDialog, (value) => {
  if (value) {
    isEditingGroup.value = false;
    resetGroupForm();
    showGroupDialog.value = true;
    showAddGroupDialog.value = false;
  }
});

function editGroup(group: ConnectionGroup) {
  isEditingGroup.value = true;
  Object.assign(groupForm, group);
  showGroupDialog.value = true;
}

function confirmDeleteGroup(group: ConnectionGroup) {
  if (isDefaultGroup(group) || hasConnections(group.id)) {
    ElMessage.warning('默认分组或包含连接的分组不能被删除');
    return;
  }
  
  groupToDelete.value = group;
  showDeleteConfirmation.value = true;
}

function saveGroup() {
  if (!groupForm.name.trim()) {
    ElMessage.warning('分组名称不能为空');
    return;
  }
  
  // 检查重名
  const existingGroup = groups.value.find(g => 
    g.name === groupForm.name.trim() && g.id !== groupForm.id
  );
  
  if (existingGroup) {
    ElMessage.warning('已存在同名分组');
    return;
  }
  
  if (isEditingGroup.value) {
    // 更新现有分组
    const index = groups.value.findIndex(g => g.id === groupForm.id);
    if (index !== -1) {
      groups.value[index] = { ...groupForm };
    }
  } else {
    // 添加新分组
    const newId = `group_${Date.now()}`;
    groups.value.push({
      ...groupForm,
      id: newId
    });
  }
  
  // 保存分组
  storageService.saveConnectionGroups(groups.value);
  
  // 通知父组件
  emit('update:groups', groups.value);
  
  showGroupDialog.value = false;
  resetGroupForm();
  
  ElMessage.success(isEditingGroup.value ? '分组已更新' : '分组已创建');
}

function deleteGroup() {
  if (groupToDelete.value) {
    // 从列表中移除分组
    groups.value = groups.value.filter(g => g.id !== groupToDelete.value!.id);
    
    // 保存更新后的分组列表
    storageService.saveConnectionGroups(groups.value);
    
    // 通知父组件
    emit('update:groups', groups.value);
    
    // 关闭对话框
    showDeleteConfirmation.value = false;
    groupToDelete.value = null;
    
    ElMessage.success('分组已删除');
  }
}

function isDefaultGroup(group: ConnectionGroup): boolean {
  return group.id === 'default';
}

function hasConnections(groupId: string): boolean {
  return connections.value.some(conn => conn.group === getGroupNameById(groupId));
}

function getGroupNameById(groupId: string): string {
  const group = groups.value.find(g => g.id === groupId);
  return group ? group.name : '默认';
}

function getConnectionCountInGroup(groupId: string): number {
  const groupName = getGroupNameById(groupId);
  return connections.value.filter(conn => conn.group === groupName).length;
}

// 加载数据
onMounted(() => {
  groups.value = storageService.loadConnectionGroups();
  connections.value = storageService.loadConnections();
});
</script> 