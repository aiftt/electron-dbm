<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 class="text-2xl font-medium text-gray-800 dark:text-gray-200 mb-6">Page Not Found</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <el-button type="primary" @click="$router.push('/')">
        Return to Home
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Not Found page logic would go here
</script> 