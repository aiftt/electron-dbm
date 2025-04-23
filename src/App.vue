<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// App component logic goes here
</script>

<style>
@import './assets/css/tailwind.css';

html, body {
  @apply m-0 p-0 h-full overflow-hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
}

#app {
  @apply h-full;
}
</style> 