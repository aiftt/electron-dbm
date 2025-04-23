<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Database Connections</h1>
        <el-button type="primary" @click="showNewConnectionDialog = true">New Connection</el-button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-if="connections.length">
          <div v-for="connection in connections" :key="connection.id" class="card">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 class="font-medium">{{ connection.name }}</h3>
              <el-dropdown>
                <el-button type="text">
                  <i class="fas fa-ellipsis-v"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openQueryEditor(connection.id)">
                      <i class="fas fa-code mr-2"></i> Query
                    </el-dropdown-item>
                    <el-dropdown-item @click="editConnection(connection)">
                      <i class="fas fa-edit mr-2"></i> Edit
                    </el-dropdown-item>
                    <el-dropdown-item @click="confirmDeleteConnection(connection)">
                      <i class="fas fa-trash mr-2 text-red-500"></i> Delete
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="p-4">
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                {{ connection.type }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">Host:</span>
                {{ connection.host }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                <span class="font-medium text-gray-700 dark:text-gray-300">Database:</span>
                {{ connection.database }}
              </div>
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-700 flex items-center space-x-2">
              <el-button plain size="small" @click="testConnection(connection)">Test</el-button>
              <el-button type="primary" plain size="small" @click="openQueryEditor(connection.id)">
                Connect
              </el-button>
            </div>
          </div>
        </template>
        
        <div v-else class="col-span-full">
          <el-empty description="No connections found">
            <el-button type="primary" @click="showNewConnectionDialog = true">
              Create Connection
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>
    
    <!-- New/Edit Connection Dialog -->
    <el-dialog
      v-model="showNewConnectionDialog"
      :title="isEditingConnection ? 'Edit Connection' : 'New Connection'"
      width="500px"
    >
      <el-form :model="connectionForm" label-width="120px">
        <el-form-item label="Name">
          <el-input v-model="connectionForm.name" placeholder="My Connection" />
        </el-form-item>
        <el-form-item label="Type">
          <el-select v-model="connectionForm.type" placeholder="Select database type" style="width: 100%">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="SQLite" value="sqlite" />
          </el-select>
        </el-form-item>
        <el-form-item label="Host" v-if="connectionForm.type !== 'sqlite'">
          <el-input v-model="connectionForm.host" placeholder="localhost" />
        </el-form-item>
        <el-form-item label="Port" v-if="connectionForm.type !== 'sqlite'">
          <el-input-number v-model="connectionForm.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Database">
          <el-input v-model="connectionForm.database" placeholder="mydatabase" />
        </el-form-item>
        <el-form-item label="Username" v-if="connectionForm.type !== 'sqlite'">
          <el-input v-model="connectionForm.username" placeholder="root" />
        </el-form-item>
        <el-form-item label="Password" v-if="connectionForm.type !== 'sqlite'">
          <el-input v-model="connectionForm.password" type="password" placeholder="********" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showNewConnectionDialog = false">Cancel</el-button>
          <el-button type="primary" @click="saveConnection">Save</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <el-dialog
      v-model="showDeleteConfirmation"
      title="Delete Connection"
      width="400px"
    >
      <p>Are you sure you want to delete this connection?</p>
      <p class="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirmation = false">Cancel</el-button>
          <el-button type="danger" @click="deleteConnection">Delete</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Sample connection data (will be replaced with actual storage later)
const connections = ref([
  {
    id: 1,
    name: 'Local MySQL',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'root',
    password: '******'
  }
]);

const showNewConnectionDialog = ref(false);
const showDeleteConfirmation = ref(false);
const isEditingConnection = ref(false);
const connectionToDelete = ref<any>(null);

const connectionForm = reactive({
  id: 0,
  name: '',
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: '',
  username: '',
  password: ''
});

function resetConnectionForm() {
  connectionForm.id = 0;
  connectionForm.name = '';
  connectionForm.type = 'mysql';
  connectionForm.host = 'localhost';
  connectionForm.port = 3306;
  connectionForm.database = '';
  connectionForm.username = '';
  connectionForm.password = '';
}

function openQueryEditor(connectionId: number) {
  router.push(`/query/${connectionId}`);
}

function editConnection(connection: any) {
  isEditingConnection.value = true;
  Object.assign(connectionForm, connection);
  showNewConnectionDialog.value = true;
}

function confirmDeleteConnection(connection: any) {
  connectionToDelete.value = connection;
  showDeleteConfirmation.value = true;
}

function saveConnection() {
  if (isEditingConnection.value) {
    // Edit existing connection
    const index = connections.value.findIndex(c => c.id === connectionForm.id);
    if (index !== -1) {
      connections.value[index] = { ...connectionForm };
    }
  } else {
    // Add new connection
    const newId = connections.value.length > 0 
      ? Math.max(...connections.value.map(c => c.id)) + 1 
      : 1;
    connections.value.push({ ...connectionForm, id: newId });
  }
  
  showNewConnectionDialog.value = false;
  isEditingConnection.value = false;
  resetConnectionForm();
}

function deleteConnection() {
  if (connectionToDelete.value) {
    connections.value = connections.value.filter(c => c.id !== connectionToDelete.value.id);
    showDeleteConfirmation.value = false;
    connectionToDelete.value = null;
  }
}

function testConnection(connection: any) {
  // Mock functionality - would actually test the connection in a real app
  // For demo purposes, just show a message
  alert(`Testing connection to ${connection.name}...`);
}
</script> 