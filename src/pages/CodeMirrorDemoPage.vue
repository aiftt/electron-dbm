<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">CodeMirror Editor Demo</h1>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">SQL Editor</h2>
      <div class="bg-white dark:bg-gray-800 rounded shadow p-4">
        <div class="flex justify-end mb-3">
          <el-button-group>
            <el-button size="small" @click="formatSql">
              <Icon icon="mdi:format-align-left" class="mr-1" /> 格式化
            </el-button>
            <el-button size="small" @click="executeQuery">
              <Icon icon="mdi:play" class="mr-1" /> 执行
            </el-button>
          </el-button-group>
        </div>
        
        <div class="h-80">
          <CodeMirrorEditor
            v-model="sqlQuery"
            height="100%"
            :theme="isDarkMode ? 'dark' : 'light'"
            :indentSize="indentSize"
            @execute-query="executeQuery"
            ref="editorRef"
          />
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 class="text-xl font-semibold mb-3">设置</h2>
        
        <div class="mb-4">
          <div class="text-sm font-medium mb-2">主题:</div>
          <el-radio-group v-model="themeOption" size="small">
            <el-radio-button :value="'light'">亮色</el-radio-button>
            <el-radio-button :value="'dark'">暗色</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="mb-4">
          <div class="text-sm font-medium mb-2">缩进大小:</div>
          <el-radio-group v-model="indentSize" size="small">
            <el-radio-button :value="2">2空格</el-radio-button>
            <el-radio-button :value="4">4空格</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="mb-4">
          <el-button type="primary" @click="loadExample">加载示例查询</el-button>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 class="text-xl font-semibold mb-3">格式化结果</h2>
        <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded h-64 overflow-auto text-sm">{{ formattedSql }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { ElMessage } from 'element-plus';
import CodeMirrorEditor from '../components/CodeMirrorEditor.vue';
import { sqlFormatter } from '../services/sql-formatter';

// 设置项
const themeOption = ref('light');
const indentSize = ref(2);

// SQL 查询示例
const sqlQuery = ref(
`SELECT u.id, u.username, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.email
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC
LIMIT 10;`
);

// 格式化后的SQL
const formattedSql = ref('');

// 编辑器引用
const editorRef = ref<InstanceType<typeof CodeMirrorEditor> | null>(null);

// 是否为暗黑模式
const isDarkMode = computed(() => {
  return themeOption.value === 'dark' || document.documentElement.classList.contains('dark');
});

// 格式化 SQL
function formatSql() {
  if (editorRef.value) {
    editorRef.value.formatSql();
    
    // 同时更新格式化后的显示
    formattedSql.value = sqlFormatter.formatSql(sqlQuery.value, {
      uppercase: true,
      indentSize: indentSize.value
    });
  }
}

// 执行查询 (模拟)
function executeQuery() {
  ElMessage.success('查询已执行！（这是一个演示）');
  // 更新格式化显示
  formattedSql.value = sqlFormatter.formatSql(sqlQuery.value, {
    uppercase: true,
    indentSize: indentSize.value
  });
}

// 加载不同的示例
function loadExample() {
  const examples = [
    `SELECT * FROM products WHERE category = 'electronics' AND price < 1000 ORDER BY price ASC;`,
    `INSERT INTO orders (user_id, product_id, quantity, price) VALUES (1, 100, 2, 199.99);`,
    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id IN (SELECT user_id FROM sessions WHERE expired = 0);`,
    `DELETE FROM carts WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'abandoned';`,
    `SELECT 
  c.customer_name,
  SUM(o.total_amount) as total_spent,
  COUNT(o.id) as order_count,
  MAX(o.order_date) as last_order_date
FROM 
  customers c
JOIN 
  orders o ON c.id = o.customer_id
WHERE 
  o.order_date BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY 
  c.customer_name
HAVING 
  total_spent > 1000
ORDER BY 
  total_spent DESC
LIMIT 20;`
  ];
  
  // 随机选择一个示例
  const randomIndex = Math.floor(Math.random() * examples.length);
  sqlQuery.value = examples[randomIndex];
  
  // 更新格式化显示
  formattedSql.value = sqlFormatter.formatSql(sqlQuery.value, {
    uppercase: true,
    indentSize: indentSize.value
  });
}

// 监听 SQL 变化
watch(sqlQuery, () => {
  // 如果需要实时更新格式化显示，可以取消注释下面的代码
  // formattedSql.value = sqlFormatter.formatSql(sqlQuery.value, {
  //   uppercase: true,
  //   indentSize: indentSize.value
  // });
});

// 初始加载时格式化一次
loadExample();
</script> 