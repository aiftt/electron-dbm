<template>
  <div class="favorite-queries">
    <h3 class="text-lg font-medium mb-3">收藏的查询</h3>
    
    <div v-if="favoriteQueries.length > 0" class="space-y-3">
      <div
        v-for="query in favoriteQueries"
        :key="query.id"
        class="bg-white dark:bg-gray-750 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        @click="executeQuery(query)"
      >
        <div class="flex justify-between items-start">
          <div>
            <div class="font-medium">
              <span v-if="query.name">{{ query.name }}</span>
              <span v-else class="text-gray-600 dark:text-gray-400">
                <span v-if="query.sql.length > 40">{{ query.sql.substring(0, 40) }}...</span>
                <span v-else>{{ query.sql }}</span>
              </span>
            </div>
            
            <div class="text-xs text-gray-500 mt-1">
              {{ getConnectionName(query.connectionId) }} / {{ query.database }}
            </div>
            
            <div class="mt-2" v-if="query.tags && query.tags.length > 0">
              <el-tag 
                v-for="tag in query.tags" 
                :key="tag" 
                size="small" 
                class="mr-1"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <div class="flex space-x-1">
            <el-tooltip content="从收藏中移除">
              <el-button 
                type="danger" 
                size="small" 
                circle 
                plain
                @click.stop="removeFromFavorites(query)"
              >
                <Icon icon="mdi:star-off" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center p-4 text-gray-500 dark:text-gray-400">
      暂无收藏的查询
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ElMessage } from 'element-plus';
import { queryHistoryService, type QueryHistoryItem } from '../services/query-history';
import { storageService, type DbConnection } from '../utils/storage';

const router = useRouter();
const favoriteQueries = ref<QueryHistoryItem[]>([]);
const connections = ref<DbConnection[]>([]);

const emit = defineEmits(['query-selected']);

// 获取连接名称
function getConnectionName(connectionId: number): string {
  const connection = connections.value.find(conn => conn.id === connectionId);
  return connection ? connection.name : '未知连接';
}

// 执行查询
function executeQuery(query: QueryHistoryItem): void {
  // 发出事件，通知父组件加载该查询
  emit('query-selected', query.sql);
  
  // 如果需要切换连接，则导航到对应连接的查询编辑器
  const currentConnectionId = Number(router.currentRoute.value.params.connectionId);
  if (currentConnectionId !== query.connectionId) {
    router.push({
      path: `/query/${query.connectionId}`,
      query: { sql: encodeURIComponent(query.sql) }
    });
  }
}

// 从收藏中移除
function removeFromFavorites(query: QueryHistoryItem): void {
  if (queryHistoryService.setQueryFavorite(query.id, false)) {
    // 从列表中移除
    favoriteQueries.value = favoriteQueries.value.filter(q => q.id !== query.id);
    ElMessage.success('已从收藏中移除');
  }
}

// 加载收藏的查询
function loadFavoriteQueries(): void {
  favoriteQueries.value = queryHistoryService.getFavoriteQueries();
}

onMounted(() => {
  loadFavoriteQueries();
  connections.value = storageService.loadConnections();
});
</script>

<style scoped>
.favorite-queries {
  max-height: 100%;
  overflow-y: auto;
}
</style> 