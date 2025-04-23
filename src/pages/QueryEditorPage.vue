<template>
  <div class="h-full flex flex-col">
    <!-- Database and Query Tabs -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
      <el-tabs v-model="activeTab" class="demo-tabs" type="card" closable @tab-remove="removeTab">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :label="tab.title"
          :name="tab.name"
        ></el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Database Objects Sidebar -->
      <div class="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        <div class="p-3">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Database: {{ connection?.database }}</h3>
          
          <el-menu
            default-active="1"
            class="border-0 dark:bg-gray-800 dark:text-gray-200"
            background-color="transparent"
          >
            <el-sub-menu index="tables">
              <template #title>
                <span class="text-sm">Tables</span>
              </template>
              <el-menu-item v-for="table in databaseObjects.tables" :key="table" :index="`table-${table}`"
                @click="openTable(table)">
                {{ table }}
              </el-menu-item>
            </el-sub-menu>
            
            <el-sub-menu index="views">
              <template #title>
                <span class="text-sm">Views</span>
              </template>
              <el-menu-item v-for="view in databaseObjects.views" :key="view" :index="`view-${view}`">
                {{ view }}
              </el-menu-item>
            </el-sub-menu>
            
            <el-sub-menu index="procedures">
              <template #title>
                <span class="text-sm">Stored Procedures</span>
              </template>
              <el-menu-item v-for="proc in databaseObjects.procedures" :key="proc" :index="`proc-${proc}`">
                {{ proc }}
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </div>
      
      <!-- Query Editor and Results -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Query Editor -->
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 h-2/5 overflow-hidden flex flex-col">
          <div class="flex justify-between items-center mb-2">
            <div>
              <el-button-group>
                <el-button type="primary" size="small" @click="executeQuery">
                  <i class="fas fa-play mr-1"></i> Execute
                </el-button>
                <el-button size="small">
                  <i class="fas fa-save mr-1"></i> Save
                </el-button>
                <el-button size="small">
                  <i class="fas fa-file mr-1"></i> New
                </el-button>
              </el-button-group>
            </div>
            <div>
              <el-select v-model="selectedDatabase" placeholder="Select Database" size="small">
                <el-option
                  v-for="db in availableDatabases"
                  :key="db"
                  :label="db"
                  :value="db"
                ></el-option>
              </el-select>
            </div>
          </div>
          
          <!-- This would be a code editor like Monaco in a real app -->
          <div class="flex-1 overflow-hidden">
            <el-input
              v-model="sqlQuery"
              type="textarea"
              :rows="10"
              placeholder="Enter SQL query here..."
              class="editor-textarea"
            ></el-input>
          </div>
        </div>
        
        <!-- Query Results -->
        <div class="flex-1 overflow-auto p-3">
          <div class="mb-2 flex justify-between items-center">
            <h3 class="text-sm font-medium">Results</h3>
            <span v-if="queryExecuted" class="text-xs text-gray-500 dark:text-gray-400">
              {{ queryResults.length }} rows in {{ executionTime }}ms
            </span>
          </div>
          
          <el-table v-if="queryExecuted" :data="queryResults" border style="width: 100%" height="100%">
            <el-table-column 
              v-for="column in resultColumns" 
              :key="column" 
              :prop="column" 
              :label="column"
              :width="150"
            ></el-table-column>
          </el-table>
          
          <el-empty v-else description="No query results to display"></el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const connectionId = computed(() => Number(route.params.connectionId));

// Mock connection data
const connection = ref({
  id: 1,
  name: 'Local MySQL',
  database: 'test_db',
  type: 'mysql'
});

// Mock available databases
const availableDatabases = ref(['test_db', 'information_schema', 'performance_schema']);
const selectedDatabase = ref('test_db');

// Mock database objects
const databaseObjects = ref({
  tables: ['users', 'products', 'orders', 'order_items'],
  views: ['active_users', 'product_inventory'],
  procedures: ['get_user_orders', 'update_inventory']
});

// Tabs state
const activeTab = ref('query1');
const tabs = ref([
  { title: 'Query 1', name: 'query1', content: '' }
]);

// Query state
const sqlQuery = ref('SELECT * FROM users LIMIT 10;');
const queryExecuted = ref(false);
const queryResults = ref([]);
const resultColumns = ref([]);
const executionTime = ref(0);

function executeQuery() {
  // Start timer
  const startTime = performance.now();
  
  // In a real app, this would send the query to the server
  // For demo purposes, we'll generate mock data
  setTimeout(() => {
    // Generate mock columns
    resultColumns.value = ['id', 'username', 'email', 'created_at'];
    
    // Generate mock results
    queryResults.value = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      created_at: new Date().toISOString().split('T')[0]
    }));
    
    // Set executed flag
    queryExecuted.value = true;
    
    // Calculate execution time
    executionTime.value = Math.round(performance.now() - startTime);
  }, 500);
}

function removeTab(targetName: string) {
  const tabs = tabs.value;
  if (activeTab.value === targetName) {
    tabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1];
        if (nextTab) {
          activeTab.value = nextTab.name;
        }
      }
    });
  }
  
  tabs.value = tabs.filter(tab => tab.name !== targetName);
}

function openTable(tableName: string) {
  // Generate a SELECT query for the table
  sqlQuery.value = `SELECT * FROM ${tableName} LIMIT 100;`;
}

onMounted(() => {
  // In a real app, we would load connection details based on connectionId
  console.log(`Connected to database with id: ${connectionId.value}`);
});
</script>

<style scoped>
:deep(.el-tabs__header) {
  margin-bottom: 0;
}

.editor-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.dark .editor-textarea :deep(.el-textarea__inner) {
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-color: #2d2d2d;
}
</style> 