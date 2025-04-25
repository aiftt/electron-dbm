<template>
  <div class="codemirror-wrapper" :style="{ height }">
    <Codemirror
      v-model="code"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="indentSize"
      :extensions="extensions"
      :style="{ height: '100%' }"
      @ready="handleReady"
      @keydown="handleKeyDown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView } from 'codemirror';
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
  },
  indentSize: {
    type: Number,
    default: 2
  }
});

// 事件
const emit = defineEmits(['update:modelValue', 'editor-mounted', 'execute-query']);

// 本地代码
const code = ref(props.modelValue);
const view = ref<EditorView | null>(null);

// 扩展配置
const extensions = computed(() => {
  const exts = [
    sql(),
    keymap.of([
      ...defaultKeymap,
      {
        key: 'Ctrl-Enter',
        run: () => {
          executeQuery();
          return true;
        }
      },
      {
        key: 'Cmd-Enter',
        run: () => {
          executeQuery();
          return true;
        }
      }
    ])
  ];

  // 根据主题添加相应的扩展
  if (props.theme === 'dark') {
    exts.push(oneDark);
  } else {
    exts.push(EditorView.theme({
      "&": {
        backgroundColor: "#ffffff",
        color: "#333"
      },
      ".cm-content": {
        caretColor: "#0e9"
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "#0e9"
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(233, 233, 253, 0.3)"
      }
    }));
  }

  if (props.readOnly) {
    exts.push(EditorView.editable.of(false));
  }

  return exts;
});

// 初始化编辑器
function handleReady(payload: { view: EditorView }) {
  view.value = payload.view;
  emit('editor-mounted', payload.view);
}

// 处理按键事件
function handleKeyDown(event: KeyboardEvent) {
  // 这些快捷键已经在 extensions 中处理，这里主要用于自定义处理
  // 可以根据需要添加更多自定义快捷键
}

// 执行查询的方法
function executeQuery() {
  emit('execute-query');
}

// 格式化 SQL
function formatSql() {
  if (code.value) {
    code.value = sqlFormatter.formatSql(code.value, {
      uppercase: true,
      indentSize: props.indentSize
    });
  }
}

// 聚焦方法
function focus() {
  if (view.value) {
    view.value.focus();
  }
}

// 监听值变化
watch(code, (newValue) => {
  emit('update:modelValue', newValue);
});

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== code.value) {
    code.value = newValue;
  }
});

// 公开的方法
defineExpose({
  formatSql,
  focus,
  view
});
</script>

<style scoped>
.codemirror-wrapper {
  width: 100%;
  overflow: hidden;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
}

/* 增加一些基本样式覆盖 */
:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-scroller) {
  overflow: auto;
  height: 100%;
}

:deep(.cm-content) {
  padding: 10px 0;
}
</style> 