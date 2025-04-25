<template>
  <div class="simple-textarea" :style="{ height: height }">
    <el-input
      v-model="inputValue"
      type="textarea"
      :rows="20"
      :placeholder="placeholder"
      :readonly="readOnly"
      class="full-height-textarea"
      @keydown.ctrl.enter="executeQuery"
      @keydown.meta.enter="executeQuery"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { sqlFormatter } from '../services/sql-formatter';

// 组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '300px'
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '输入 SQL 查询...'
  },
  theme: {
    type: String,
    default: 'light'
  }
});

// 事件
const emit = defineEmits(['update:modelValue', 'editor-mounted', 'execute-query']);

// 本地输入值
const inputValue = ref(props.modelValue);

// 执行查询的方法
function executeQuery() {
  emit('execute-query');
}

// 格式化 SQL
function formatSql() {
  inputValue.value = sqlFormatter.formatSql(inputValue.value);
}

// 监听值变化
watch(inputValue, (newValue) => {
  emit('update:modelValue', newValue);
});

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue;
});

// 公开的方法
defineExpose({
  formatSql,
  focus: () => {
    const textareaEl = document.querySelector('.simple-textarea textarea');
    if (textareaEl) {
      (textareaEl as HTMLTextAreaElement).focus();
    }
  }
});
</script>

<style scoped>
.simple-textarea {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-textarea {
  height: 100%;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  height: 100%;
  line-height: 1.5;
  font-size: 14px;
  resize: none;
}

.dark :deep(.el-textarea__inner) {
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-color: #2d2d2d;
}
</style> 