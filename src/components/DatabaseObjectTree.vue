<template>
  <div class="database-object-tree">
    <div v-if="loading" class="p-4 text-center">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="error" class="p-4 text-center text-red-500">
      <Icon icon="mdi:alert-circle" class="text-xl" />
      <p class="text-sm mt-1">{{ error }}</p>
      <el-button size="small" plain class="mt-2" @click="fetchDatabaseObjects">
        重试
      </el-button>
    </div>
    <el-tree
      v-else
      :data="objectTree"
      node-key="id"
      :props="defaultProps"
      :highlight-current="true"
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <div class="flex items-center">
          <Icon v-if="data.icon" :icon="data.icon" class="mr-1" />
          <span>{{ node.label }}</span>
          <span v-if="data.children && data.children.length" class="ml-1 text-xs text-gray-500">
            ({{ data.children.length }})
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { databaseService, type DbConnection, type DbObject, type DbObjectType } from '../services/database';

// 定义树节点类型
interface TreeNode {
  id: string;
  name: string;
  type: string;
  icon?: string;
  children?: TreeNode[];
}

const props = defineProps<{
  connectionId: number;
  selectedDatabase?: string;
}>();

const emit = defineEmits<{
  (e: 'object-selected', name: string, type: string): void;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const objectTree = ref<TreeNode[]>([]);

const defaultProps = {
  children: 'children',
  label: 'name'
};

const handleNodeClick = (data: TreeNode) => {
  if (['table', 'view', 'procedure', 'function'].includes(data.type)) {
    emit('object-selected', data.name, data.type);
  }
};

const fetchDatabaseObjects = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 获取数据库对象列表
    const objects = await databaseService.getDatabaseObjects(props.connectionId);
    
    // 构建树形结构
    const tables: TreeNode[] = [];
    const views: TreeNode[] = [];
    const procedures: TreeNode[] = [];
    const functions: TreeNode[] = [];
    
    objects.forEach(obj => {
      const node: TreeNode = {
        id: `${obj.type}-${obj.name}`,
        name: obj.name,
        type: obj.type,
        icon: getObjectIcon(obj.type)
      };
      
      if (obj.type === 'table') {
        tables.push(node);
      } else if (obj.type === 'view') {
        views.push(node);
      } else if (obj.type === 'procedure') {
        procedures.push(node);
      } else if (obj.type === 'function') {
        functions.push(node);
      }
    });
    
    // 创建根节点
    objectTree.value = [
      {
        id: 'tables',
        name: '表',
        type: 'folder',
        icon: 'mdi:table',
        children: tables.sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: 'views',
        name: '视图',
        type: 'folder',
        icon: 'mdi:eye',
        children: views.sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: 'procedures',
        name: '存储过程',
        type: 'folder',
        icon: 'mdi:function',
        children: procedures.sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: 'functions',
        name: '函数',
        type: 'folder',
        icon: 'mdi:function-variant',
        children: functions.sort((a, b) => a.name.localeCompare(b.name))
      }
    ];
    
  } catch (err: any) {
    console.error('获取数据库对象失败:', err);
    error.value = err.message || '获取数据库对象失败';
    objectTree.value = [];
  } finally {
    loading.value = false;
  }
};

// 根据对象类型获取图标
function getObjectIcon(type: string): string {
  switch (type) {
    case 'table': return 'mdi:table';
    case 'view': return 'mdi:eye';
    case 'procedure': return 'mdi:function';
    case 'function': return 'mdi:function-variant';
    default: return 'mdi:database';
  }
}

watch(() => props.connectionId, (newVal) => {
  if (newVal) {
    fetchDatabaseObjects();
  } else {
    objectTree.value = [];
  }
});

onMounted(() => {
  if (props.connectionId) {
    fetchDatabaseObjects();
  }
});
</script>

<style scoped>
.database-object-tree {
  height: 100%;
  overflow-y: auto;
}

:deep(.el-tree-node__content) {
  height: 2rem;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f3f4f6;
}

.dark :deep(.el-tree-node__content:hover) {
  background-color: #374151;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

.dark :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #0c4a6e;
  color: #38bdf8;
}
</style> 