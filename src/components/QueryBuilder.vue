<template>
  <div class="query-builder">
    <h3 class="text-lg font-medium mb-3">可视化查询构建器</h3>
    
    <!-- 查询构建区域 -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <!-- 表选择 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          选择表
        </label>
        <el-select
          v-model="selectedTable"
          placeholder="选择要查询的表"
          style="width: 100%"
          @change="onTableSelected"
        >
          <el-option
            v-for="table in tables"
            :key="table"
            :label="table"
            :value="table"
          />
        </el-select>
      </div>
      
      <!-- 列选择 -->
      <div class="mb-4" v-if="selectedTable">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          选择要查询的列
        </label>
        <div class="flex items-center mb-2">
          <el-checkbox v-model="selectAllColumns" @change="toggleAllColumns">
            全选
          </el-checkbox>
          
          <div class="ml-auto">
            <el-button size="small" plain @click="addCustomExpression">
              <Icon icon="mdi:function" class="mr-1" /> 添加表达式
            </el-button>
          </div>
        </div>
        
        <el-checkbox-group v-model="selectedColumns">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <el-checkbox
              v-for="column in availableColumns"
              :key="column"
              :label="column"
              border
            >
              {{ column }}
            </el-checkbox>
          </div>
        </el-checkbox-group>
        
        <!-- 自定义表达式 -->
        <div v-if="customExpressions.length > 0" class="mt-4 space-y-2">
          <div 
            v-for="(expr, index) in customExpressions" 
            :key="index"
            class="flex items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
          >
            <div class="flex-1 grid grid-cols-3 gap-2">
              <el-input v-model="expr.expression" placeholder="表达式..." class="col-span-2" />
              <el-input v-model="expr.alias" placeholder="别名..." />
            </div>
            <el-button type="danger" icon="mdi:delete" circle plain @click="removeExpression(index)" class="ml-2" />
          </div>
        </div>
      </div>
      
      <!-- 条件筛选 -->
      <div class="mb-4" v-if="selectedTable">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          条件筛选
        </label>
        
        <div v-if="conditions.length === 0" class="mb-2">
          <el-button size="small" plain @click="addCondition">
            <Icon icon="mdi:filter" class="mr-1" /> 添加筛选条件
          </el-button>
        </div>
        
        <div v-else class="space-y-2">
          <div 
            v-for="(condition, index) in conditions" 
            :key="index"
            class="flex items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
          >
            <div class="flex items-center flex-1 gap-2">
              <span v-if="index > 0" class="text-sm">且</span>
              <el-select v-model="condition.column" placeholder="选择列" style="width: 150px">
                <el-option
                  v-for="column in availableColumns"
                  :key="column"
                  :label="column"
                  :value="column"
                />
              </el-select>
              
              <el-select v-model="condition.operator" placeholder="运算符" style="width: 120px">
                <el-option label="等于" value="=" />
                <el-option label="不等于" value="!=" />
                <el-option label="大于" value=">" />
                <el-option label="小于" value="<" />
                <el-option label="大于等于" value=">=" />
                <el-option label="小于等于" value="<=" />
                <el-option label="包含" value="LIKE" />
                <el-option label="在列表中" value="IN" />
                <el-option label="为空" value="IS NULL" />
                <el-option label="不为空" value="IS NOT NULL" />
              </el-select>
              
              <el-input 
                v-if="!['IS NULL', 'IS NOT NULL'].includes(condition.operator)" 
                v-model="condition.value" 
                placeholder="值..."
                style="width: 150px"
              />
            </div>
            <el-button type="danger" icon="mdi:delete" circle plain @click="removeCondition(index)" class="ml-2" />
          </div>
          
          <div class="text-right">
            <el-button size="small" plain @click="addCondition">
              <Icon icon="mdi:plus" class="mr-1" /> 添加条件
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 排序 -->
      <div class="mb-4" v-if="selectedTable">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          排序
        </label>
        
        <div v-if="sortFields.length === 0" class="mb-2">
          <el-button size="small" plain @click="addSortField">
            <Icon icon="mdi:sort" class="mr-1" /> 添加排序
          </el-button>
        </div>
        
        <div v-else class="space-y-2">
          <div 
            v-for="(sort, index) in sortFields" 
            :key="index"
            class="flex items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
          >
            <div class="flex items-center flex-1 gap-2">
              <el-select v-model="sort.column" placeholder="选择列" style="width: 150px">
                <el-option
                  v-for="column in availableColumns"
                  :key="column"
                  :label="column"
                  :value="column"
                />
              </el-select>
              
              <el-select v-model="sort.direction" placeholder="排序方向" style="width: 120px">
                <el-option label="升序" value="ASC" />
                <el-option label="降序" value="DESC" />
              </el-select>
            </div>
            <el-button type="danger" icon="mdi:delete" circle plain @click="removeSortField(index)" class="ml-2" />
          </div>
          
          <div class="text-right">
            <el-button size="small" plain @click="addSortField">
              <Icon icon="mdi:plus" class="mr-1" /> 添加排序
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 限制和偏移 -->
      <div class="grid grid-cols-2 gap-4" v-if="selectedTable">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            行数限制
          </label>
          <el-input-number v-model="limit" :min="1" :max="1000" :step="10" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            偏移量
          </label>
          <el-input-number v-model="offset" :min="0" :max="1000" :step="10" />
        </div>
      </div>
    </div>
    
    <!-- 生成的SQL -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="flex justify-between items-center mb-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          生成的SQL
        </label>
        
        <div>
          <el-button size="small" type="primary" @click="generateSql">
            <Icon icon="mdi:refresh" class="mr-1" /> 刷新SQL
          </el-button>
          <el-button size="small" type="success" @click="applyQuery">
            <Icon icon="mdi:check" class="mr-1" /> 应用
          </el-button>
        </div>
      </div>
      
      <div class="border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 p-3">
        <pre class="text-sm overflow-x-auto">{{ generatedSql }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { sqlFormatter } from '../services/sql-formatter';

// 定义组件属性
const props = defineProps({
  tables: {
    type: Array as () => string[],
    default: () => []
  },
  columns: {
    type: Object as () => Record<string, string[]>,
    default: () => ({})
  }
});

// 定义事件
const emit = defineEmits(['apply-query']);

// 组件状态
const selectedTable = ref('');
const selectAllColumns = ref(false);
const selectedColumns = ref<string[]>([]);
const customExpressions = ref<{ expression: string; alias: string }[]>([]);
const conditions = ref<{ column: string; operator: string; value: string }[]>([]);
const sortFields = ref<{ column: string; direction: string }[]>([]);
const limit = ref(100);
const offset = ref(0);
const generatedSql = ref('');

// 计算属性：可用列
const availableColumns = computed(() => {
  if (!selectedTable.value || !props.columns[selectedTable.value]) {
    return [];
  }
  return props.columns[selectedTable.value];
});

// 监听表选择变化
watch(selectedTable, (newTable) => {
  if (newTable) {
    // 重置选择的列
    selectedColumns.value = [];
    selectAllColumns.value = false;
    
    // 重置条件和排序
    conditions.value = [];
    sortFields.value = [];
    customExpressions.value = [];
    
    // 初始化限制
    limit.value = 100;
    offset.value = 0;
  }
});

// 选择表时的处理
function onTableSelected(table: string) {
  selectedTable.value = table;
}

// 切换全选列
function toggleAllColumns(checked: boolean) {
  if (checked) {
    selectedColumns.value = [...availableColumns.value];
  } else {
    selectedColumns.value = [];
  }
}

// 添加自定义表达式
function addCustomExpression() {
  customExpressions.value.push({
    expression: '',
    alias: ''
  });
}

// 移除表达式
function removeExpression(index: number) {
  customExpressions.value.splice(index, 1);
}

// 添加条件
function addCondition() {
  conditions.value.push({
    column: availableColumns.value.length > 0 ? availableColumns.value[0] : '',
    operator: '=',
    value: ''
  });
}

// 移除条件
function removeCondition(index: number) {
  conditions.value.splice(index, 1);
}

// 添加排序字段
function addSortField() {
  sortFields.value.push({
    column: availableColumns.value.length > 0 ? availableColumns.value[0] : '',
    direction: 'ASC'
  });
}

// 移除排序字段
function removeSortField(index: number) {
  sortFields.value.splice(index, 1);
}

// 生成SQL查询
function generateSql() {
  if (!selectedTable.value) {
    generatedSql.value = '';
    return;
  }
  
  // 构建SELECT部分
  let selectPart = 'SELECT ';
  
  if (selectedColumns.value.length === 0 && customExpressions.value.length === 0) {
    selectPart += '* ';
  } else {
    const columns = selectedColumns.value.map(col => `${selectedTable.value}.${col}`);
    const expressions = customExpressions.value.map(expr => {
      if (expr.alias) {
        return `${expr.expression} AS ${expr.alias}`;
      }
      return expr.expression;
    });
    
    selectPart += [...columns, ...expressions].join(', ') + ' ';
  }
  
  // 构建FROM部分
  const fromPart = `FROM ${selectedTable.value} `;
  
  // 构建WHERE部分
  let wherePart = '';
  if (conditions.value.length > 0) {
    const conditionsStr = conditions.value.map(condition => {
      let operator = condition.operator;
      let value = condition.value;
      
      // 特殊处理 IS NULL 和 IS NOT NULL
      if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
        return `${selectedTable.value}.${condition.column} ${operator}`;
      }
      
      // 特殊处理 LIKE
      if (operator === 'LIKE') {
        value = `'%${value}%'`;
      } 
      // 特殊处理 IN
      else if (operator === 'IN') {
        value = `(${value.split(',').map(v => `'${v.trim()}'`).join(', ')})`;
      }
      // 处理字符串值
      else if (!value.match(/^[0-9.]+$/)) {
        value = `'${value}'`;
      }
      
      return `${selectedTable.value}.${condition.column} ${operator} ${value}`;
    }).join(' AND ');
    
    wherePart = `WHERE ${conditionsStr} `;
  }
  
  // 构建ORDER BY部分
  let orderByPart = '';
  if (sortFields.value.length > 0) {
    const sortParts = sortFields.value.map(sort => 
      `${selectedTable.value}.${sort.column} ${sort.direction}`
    );
    orderByPart = `ORDER BY ${sortParts.join(', ')} `;
  }
  
  // 构建LIMIT和OFFSET部分
  let limitPart = '';
  if (limit.value > 0) {
    limitPart = `LIMIT ${limit.value} `;
    
    if (offset.value > 0) {
      limitPart += `OFFSET ${offset.value} `;
    }
  }
  
  // 组合SQL查询
  const sql = selectPart + fromPart + wherePart + orderByPart + limitPart;
  
  // 格式化SQL
  generatedSql.value = sqlFormatter.formatSql(sql);
}

// 应用查询
function applyQuery() {
  generateSql();
  emit('apply-query', generatedSql.value);
}

// 初始化时生成一次SQL
generateSql();
</script>

<style scoped>
.query-builder {
  max-height: 100%;
  overflow-y: auto;
}
</style> 