<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
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
            <el-icon><i class="fas fa-home"></i></el-icon>
            <span>Home</span>
          </el-menu-item>
          <el-menu-item index="/connections">
            <el-icon><i class="fas fa-database"></i></el-icon>
            <span>Connections</span>
          </el-menu-item>
          
          <!-- Connection tree will go here -->
          <el-sub-menu index="connection-list">
            <template #title>
              <el-icon><i class="fas fa-server"></i></el-icon>
              <span>My Connections</span>
            </template>
            <!-- Sample connection, will be dynamic later -->
            <el-menu-item index="/query/1">
              <span>Sample Connection</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm h-14 flex items-center px-4">
        <div class="flex-1 flex items-center gap-4">
          <el-button type="primary" plain>
            New Connection
          </el-button>
          <el-button plain>
            New Query
          </el-button>
        </div>
        <div>
          <el-button circle>
            <i class="fas fa-cog"></i>
          </el-button>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout component logic goes here
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