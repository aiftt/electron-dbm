<template>
  <div class="p-6">
    <div class="card p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">Welcome to Electron DBM</h1>
      <p class="mb-4">A Navicat-like database management tool built with Electron and Vue 3.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
             @click="$router.push('/connections')">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <i class="fas fa-database"></i>
          </div>
          <div>
            <h3 class="font-medium">Manage Connections</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Create and manage database connections</p>
          </div>
        </div>
        
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
            <i class="fas fa-code"></i>
          </div>
          <div>
            <h3 class="font-medium">Query Editor</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Write and execute SQL queries</p>
          </div>
        </div>
        
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <i class="fas fa-table"></i>
          </div>
          <div>
            <h3 class="font-medium">Table Management</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Browse and manage database tables</p>
          </div>
        </div>
        
        <div class="card p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <div>
            <h3 class="font-medium">Import/Export</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Import and export database data</p>
          </div>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 class="font-medium mb-2">Getting Started</h3>
        <p class="text-sm">To begin, create a new database connection by clicking on the "New Connection" button or going to the Connections page.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Home page logic goes here
</script> 