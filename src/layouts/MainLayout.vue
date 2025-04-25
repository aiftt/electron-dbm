<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <div class="w-64 bg-white dark:bg-gray-800 shadow-md overflow-y-auto flex flex-col">
      <div class="p-4">
        <h1 class="text-xl font-bold text-primary-600">Electron DBM</h1>
      </div>
      <div class="p-2 flex-shrink-0">
        <el-menu
          default-active="1"
          class="border-0 dark:bg-gray-800 dark:text-gray-200"
          router
          background-color="transparent"
        >
          <el-menu-item index="/">
            <el-icon>
              <Icon icon="mdi:home" />
            </el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/connections">
            <el-icon>
              <Icon icon="mdi:database" />
            </el-icon>
            <span>连接管理</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <div class="p-2 pt-0 flex-shrink-0">
        <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 px-2 flex items-center justify-between">
          <span>数据库连接</span>
          <el-button
            size="small"
            type="primary"
            link
            @click="openConnectionsPage"
          >
            <Icon icon="mdi:plus" />
          </el-button>
        </div>
        
        <!-- 连接树 -->
        <el-menu
          class="border-0 dark:bg-gray-800 dark:text-gray-200"
          background-color="transparent"
        >
          <template v-if="connections.length">
            <el-sub-menu v-for="connection in connections" :key="connection.id" :index="`conn-${connection.id}`">
              <template #title>
                <el-icon>
                  <Icon :icon="getConnectionIcon(connection.type)" />
                </el-icon>
                <span>{{ connection.name }}</span>
              </template>
              
              <!-- 连接菜单项 -->
              <el-menu-item :index="`conn-${connection.id}-query`" @click="openQueryEditor(connection.id)">
                <el-icon>
                  <Icon icon="mdi:code-braces" />
                </el-icon>
                <span>查询</span>
              </el-menu-item>
              
              <!-- 数据库对象树 -->
              <div class="pl-4 pr-2 py-1 text-sm">
                <DatabaseObjectTree 
                  :connection="activeConnectionId === connection.id ? connection : null"
                  :active="activeConnectionId === connection.id"
                  @select="handleObjectSelect"
                />
              </div>
            </el-sub-menu>
          </template>
          
          <el-menu-item v-else :index="`conn-empty`">
            <div class="text-center text-gray-500 dark:text-gray-400 text-sm p-2">
              暂无连接
            </div>
          </el-menu-item>
        </el-menu>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 页头 -->
      <header class="bg-white dark:bg-gray-800 shadow-sm h-14 flex items-center px-4">
        <div class="flex-1 flex items-center gap-4">
          <el-button type="primary" plain @click="showNewConnectionDialog">
            <Icon icon="mdi:database-plus" class="mr-1" />
            新建连接
          </el-button>
          <el-button plain @click="openNewQuery">
            <Icon icon="mdi:file-code" class="mr-1" />
            新建查询
          </el-button>
        </div>
        <div>
          <el-button circle>
            <Icon icon="mdi:cog" />
          </el-button>
        </div>
      </header>

      <!-- 主要内容 -->
      <main class="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import DatabaseObjectTree from '../components/DatabaseObjectTree.vue';
import { DbConnection } from '../services/database';

const router = useRouter();
const connections = ref<DbConnection[]>([]);
const activeConnectionId = ref<number | null>(null);

// 从本地存储加载连接
const loadConnections = () => {
  const savedConnections = localStorage.getItem('db_connections');
  if (savedConnections) {
    connections.value = JSON.parse(savedConnections);
  }
};

// 获取连接图标
const getConnectionIcon = (type: string) => {
  switch (type) {
    case 'mysql':
      return 'simple-icons:mysql';
    case 'postgresql':
      return 'simple-icons:postgresql';
    case 'sqlite':
      return 'simple-icons:sqlite';
    default:
      return 'mdi:database';
  }
};

// 打开连接页面
const openConnectionsPage = () => {
  router.push('/connections');
};

// 显示新建连接对话框
const showNewConnectionDialog = () => {
  router.push('/connections');
};

// 打开查询编辑器
const openQueryEditor = (connectionId: number) => {
  activeConnectionId.value = connectionId;
  router.push(`/query/${connectionId}`);
};

// 打开新查询
const openNewQuery = () => {
  // 如果有连接，则打开第一个连接的查询编辑器
  if (connections.value.length > 0) {
    openQueryEditor(connections.value[0].id);
  } else {
    // 否则跳转到连接管理页面
    router.push('/connections');
  }
};

// 处理数据库对象选择
const handleObjectSelect = (objectId: string, objectType: string, objectName: string) => {
  console.log('选择对象:', objectId, objectType, objectName);
  
  if (activeConnectionId.value !== null) {
    // 根据对象类型执行不同操作
    switch (objectType) {
      case 'table':
        router.push(`/table/${activeConnectionId.value}/${objectName}`);
        break;
      case 'view':
        router.push(`/table/${activeConnectionId.value}/${objectName}?type=view`);
        break;
      default:
        // 对于其他类型的对象，可以生成并打开一个查询
        router.push(`/query/${activeConnectionId.value}?object=${objectName}&type=${objectType}`);
    }
  }
};

onMounted(() => {
  loadConnections();
  
  // 监听连接变化事件
  window.addEventListener('connections-updated', () => {
    loadConnections();
  });
});
</script>

<style scoped>
:deep(.el-menu) {
  @apply w-full bg-transparent;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  @apply text-gray-700 dark:text-gray-300;
}

:deep(.el-menu-item.is-active) {
  @apply text-primary-600 dark:text-primary-400;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  @apply bg-gray-100 dark:bg-gray-700 !important;
}
</style> 