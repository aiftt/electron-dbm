<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <div class="w-64 bg-white dark:bg-gray-800 shadow-md overflow-y-auto">
      <div class="p-4">
        <h1 class="text-xl font-bold text-primary-600">Electron DBM</h1>
      </div>
      <div class="p-2">
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
          
          <!-- 连接树将在此处显示 -->
          <el-sub-menu index="connection-list">
            <template #title>
              <el-icon>
                <Icon icon="mdi:server" />
              </el-icon>
              <span>我的连接</span>
            </template>
            <!-- 示例连接，后续会动态生成 -->
            <el-menu-item index="/query/1">
              <span>示例连接</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 页头 -->
      <header class="bg-white dark:bg-gray-800 shadow-sm h-14 flex items-center px-4">
        <div class="flex-1 flex items-center gap-4">
          <el-button type="primary" plain>
            <Icon icon="mdi:database-plus" class="mr-1" />
            新建连接
          </el-button>
          <el-button plain>
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
import { Icon } from '@iconify/vue';
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