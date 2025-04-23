<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Table Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">{{ database }}.{{ table }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Connection: {{ connectionName }}
          </p>
        </div>
        <div class="flex gap-2">
          <el-button-group>
            <el-button size="small" @click="refreshData">
              <i class="fas fa-sync-alt mr-1"></i> Refresh
            </el-button>
            <el-button size="small" @click="showInsertDialog = true">
              <i class="fas fa-plus mr-1"></i> Insert
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
    
    <!-- Table Tabs -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Data" name="data"></el-tab-pane>
        <el-tab-pane label="Structure" name="structure"></el-tab-pane>
        <el-tab-pane label="Indexes" name="indexes"></el-tab-pane>
        <el-tab-pane label="Foreign Keys" name="foreign-keys"></el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- Table Content -->
    <div class="flex-1 overflow-auto p-4">
      <!-- Data Tab -->
      <div v-if="activeTab === 'data'" class="h-full flex flex-col">
        <!-- Filter and Pagination -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-2 items-center">
            <el-input
              v-model="filter"
              placeholder="Filter data..."
              prefix-icon="el-icon-search"
              size="small"
              class="w-64"
            ></el-input>
            <el-button size="small" @click="applyFilter">Apply</el-button>
          </div>
          
          <el-pagination
            layout="prev, pager, next"
            :total="totalRows"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handlePageChange"
          ></el-pagination>
        </div>
        
        <!-- Table Data -->
        <div class="flex-1 overflow-auto">
          <el-table
            :data="tableData"
            border
            style="width: 100%"
            height="100%"
            @row-click="handleRowClick"
          >
            <!-- Action column -->
            <el-table-column fixed="left" label="Actions" width="120">
              <template #default="scope">
                <el-button-group>
                  <el-button
                    size="small"
                    type="primary"
                    @click.stop="editRow(scope.row)"
                    icon="el-icon-edit"
                    circle
                  ></el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="confirmDeleteRow(scope.row)"
                    icon="el-icon-delete"
                    circle
                  ></el-button>
                </el-button-group>
              </template>
            </el-table-column>
            
            <!-- Dynamic columns based on table structure -->
            <el-table-column
              v-for="column in tableColumns"
              :key="column.name"
              :prop="column.name"
              :label="column.name"
              :width="column.type.includes('varchar') ? 200 : 150"
            >
              <template #default="scope">
                <span :class="{ 'text-gray-400': scope.row[column.name] === null }">
                  {{ formatColumnValue(scope.row[column.name], column.type) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <!-- Structure Tab -->
      <div v-else-if="activeTab === 'structure'">
        <el-table :data="tableColumns" border style="width: 100%">
          <el-table-column prop="name" label="Column Name" width="200"></el-table-column>
          <el-table-column prop="type" label="Data Type" width="200"></el-table-column>
          <el-table-column prop="nullable" label="Nullable" width="100">
            <template #default="scope">
              {{ scope.row.nullable ? 'YES' : 'NO' }}
            </template>
          </el-table-column>
          <el-table-column prop="key" label="Key" width="100"></el-table-column>
          <el-table-column prop="default" label="Default" width="150">
            <template #default="scope">
              <span :class="{ 'text-gray-400': scope.row.default === null }">
                {{ scope.row.default === null ? 'NULL' : scope.row.default }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="extra" label="Extra" width="150"></el-table-column>
        </el-table>
      </div>
      
      <!-- Other tabs would be implemented similarly -->
      <div v-else class="p-4">
        <el-empty :description="`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon`"></el-empty>
      </div>
    </div>
    
    <!-- Edit Row Dialog -->
    <el-dialog v-model="showEditDialog" title="Edit Row" width="700px">
      <el-form :model="editForm" label-width="150px">
        <el-form-item v-for="column in tableColumns" :key="column.name" :label="column.name">
          <el-input v-model="editForm[column.name]" :disabled="column.key === 'PRI'"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">Cancel</el-button>
          <el-button type="primary" @click="saveRow">Save</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Insert Row Dialog -->
    <el-dialog v-model="showInsertDialog" title="Insert Row" width="700px">
      <el-form :model="insertForm" label-width="150px">
        <el-form-item v-for="column in tableColumns" :key="column.name" :label="column.name">
          <el-input 
            v-model="insertForm[column.name]" 
            :disabled="column.extra === 'auto_increment'"
            :placeholder="column.nullable ? 'NULL' : ''"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showInsertDialog = false">Cancel</el-button>
          <el-button type="primary" @click="insertRow">Insert</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <el-dialog
      v-model="showDeleteConfirmation"
      title="Delete Row"
      width="400px"
    >
      <p>Are you sure you want to delete this row?</p>
      <p class="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirmation = false">Cancel</el-button>
          <el-button type="danger" @click="deleteRow">Delete</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const connectionId = computed(() => Number(route.params.connectionId));
const database = computed(() => route.params.database as string);
const table = computed(() => route.params.table as string);

// Connection info (would be fetched from a store in a real app)
const connectionName = ref('Local MySQL');

// Tab state
const activeTab = ref('data');

// Table data state
const tableData = ref([]);
const tableColumns = ref([]);
const totalRows = ref(100);
const pageSize = ref(25);
const currentPage = ref(1);
const filter = ref('');

// Dialogs
const showEditDialog = ref(false);
const showInsertDialog = ref(false);
const showDeleteConfirmation = ref(false);
const editForm = reactive({});
const insertForm = reactive({});
const selectedRow = ref(null);

function refreshData() {
  // In a real app, this would fetch data from the server
  // For demo purposes, we'll generate mock data
  loadMockData();
}

function loadMockData() {
  // Generate mock columns
  tableColumns.value = [
    { name: 'id', type: 'int(11)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment' },
    { name: 'username', type: 'varchar(50)', nullable: false, key: 'UNI', default: null, extra: '' },
    { name: 'email', type: 'varchar(100)', nullable: false, key: 'UNI', default: null, extra: '' },
    { name: 'full_name', type: 'varchar(100)', nullable: true, key: '', default: null, extra: '' },
    { name: 'active', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '' },
    { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
    { name: 'updated_at', type: 'datetime', nullable: true, key: '', default: null, extra: '' },
  ];
  
  // Generate mock data
  tableData.value = Array.from({ length: pageSize.value }, (_, i) => {
    const id = (currentPage.value - 1) * pageSize.value + i + 1;
    return {
      id: id,
      username: `user${id}`,
      email: `user${id}@example.com`,
      full_name: `User ${id}`,
      active: Math.random() > 0.2 ? 1 : 0,
      created_at: '2023-01-01 12:00:00',
      updated_at: Math.random() > 0.5 ? '2023-02-15 15:30:00' : null,
    };
  });
}

function handlePageChange(page: number) {
  currentPage.value = page;
  refreshData();
}

function applyFilter() {
  // In a real app, this would filter data based on the filter value
  console.log(`Filtering with: ${filter.value}`);
  currentPage.value = 1;
  refreshData();
}

function handleRowClick(row: any) {
  console.log('Row clicked:', row);
}

function editRow(row: any) {
  selectedRow.value = row;
  // Reset form and populate with row data
  Object.keys(editForm).forEach(key => delete editForm[key]);
  Object.assign(editForm, row);
  showEditDialog.value = true;
}

function saveRow() {
  // In a real app, this would save the edited row to the database
  console.log('Saving row:', editForm);
  // Update the row in the table
  const index = tableData.value.findIndex(row => row.id === editForm.id);
  if (index !== -1) {
    tableData.value[index] = { ...editForm };
  }
  showEditDialog.value = false;
}

function confirmDeleteRow(row: any) {
  selectedRow.value = row;
  showDeleteConfirmation.value = true;
}

function deleteRow() {
  // In a real app, this would delete the row from the database
  console.log('Deleting row:', selectedRow.value);
  // Remove the row from the table
  tableData.value = tableData.value.filter(row => row.id !== selectedRow.value.id);
  showDeleteConfirmation.value = false;
  selectedRow.value = null;
}

function insertRow() {
  // In a real app, this would insert a new row into the database
  console.log('Inserting row:', insertForm);
  // Add the row to the table
  const newId = Math.max(...tableData.value.map(row => row.id)) + 1;
  tableData.value.unshift({ ...insertForm, id: newId });
  showInsertDialog.value = false;
  // Reset the form
  Object.keys(insertForm).forEach(key => delete insertForm[key]);
}

function formatColumnValue(value: any, type: string) {
  if (value === null) return 'NULL';
  if (type.includes('tinyint') && (value === 0 || value === 1)) {
    return value === 1 ? 'Yes' : 'No';
  }
  return value;
}

onMounted(() => {
  console.log(`Loading table ${database.value}.${table.value} from connection ${connectionId.value}`);
  loadMockData();
  
  // Initialize insert form with empty values
  tableColumns.value.forEach(column => {
    insertForm[column.name] = '';
  });
});
</script> 