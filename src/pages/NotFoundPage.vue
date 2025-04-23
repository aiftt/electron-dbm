<template>
  <div class="h-full flex flex-col items-center justify-center">
    <div class="text-center">
      <div class="text-9xl font-bold text-gray-200 dark:text-gray-700">404</div>
      <h1 class="text-3xl font-bold mb-4">页面不存在</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        您要查找的页面可能已被移动或删除。
      </p>
      <router-link to="/" class="el-button el-button--primary">
        <Icon icon="mdi:home" class="mr-2" /> 返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script> 