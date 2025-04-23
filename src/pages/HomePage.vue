<template>
  <div class="p-6">
    <div class="card p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">欢迎使用 Electron DBM</h1>
      <p class="mb-4">一个基于 Electron 和 Vue 3 构建的类 Navicat 数据库管理工具。</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
             @click="$router.push('/connections')">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <Icon icon="mdi:database" width="24" />
          </div>
          <div>
            <h3 class="font-medium">管理连接</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">创建和管理数据库连接</p>
          </div>
        </div>
        
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
            <Icon icon="mdi:code-braces" width="24" />
          </div>
          <div>
            <h3 class="font-medium">查询编辑器</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">编写和执行 SQL 查询</p>
          </div>
        </div>
        
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <Icon icon="mdi:table" width="24" />
          </div>
          <div>
            <h3 class="font-medium">表管理</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">浏览和管理数据库表</p>
          </div>
        </div>
        
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Icon icon="mdi:swap-horizontal" width="24" />
          </div>
          <div>
            <h3 class="font-medium">导入/导出</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">导入和导出数据库数据</p>
          </div>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 class="font-medium mb-2">快速入门</h3>
        <p class="text-sm">点击"新建连接"按钮或前往连接管理页面，创建您的第一个数据库连接。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script> 