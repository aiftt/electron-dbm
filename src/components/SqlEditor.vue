<template>
  <div class="sql-editor" :style="{ height: height }">
    <div v-if="isMonacoLoading" class="loading-container">
      <el-icon class="loading"><Loading /></el-icon>
      <div class="mt-2 text-sm text-gray-500">加载编辑器中...</div>
    </div>
    <div v-else-if="loadError" class="error-container">
      <el-alert type="error" :closable="false" show-icon>
        <template #title>
          编辑器加载失败
        </template>
        <template #default>
          请刷新页面重试。错误: {{ loadError }}
        </template>
      </el-alert>
    </div>
    <div v-else ref="editorContainer" class="monaco-editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue';
import { sqlFormatter } from '../services/sql-formatter';
import { Loading } from '@element-plus/icons-vue';

// 使用shallowRef来存储monaco实例
const monaco = shallowRef<any>(null);

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
  theme: {
    type: String,
    default: 'vs' // 'vs', 'vs-dark', 'hc-black'
  },
  language: {
    type: String,
    default: 'sql'
  },
  databaseTables: {
    type: Array as () => string[],
    default: () => []
  },
  databaseColumns: {
    type: Object as () => Record<string, string[]>,
    default: () => ({})
  }
});

// 事件
const emit = defineEmits(['update:modelValue', 'editor-mounted', 'execute-query']);

// 编辑器引用
const editorContainer = ref<HTMLElement | null>(null);
const editor = ref<any | null>(null);
// 加载状态
const isMonacoLoading = ref(false);
const loadError = ref<string | null>(null);

// 加载Monaco编辑器
async function loadMonaco() {
  if (monaco.value) return;
  
  try {
    isMonacoLoading.value = true;
    loadError.value = null;
    
    // 动态导入Monaco编辑器
    const monacoModule = await import('monaco-editor');
    monaco.value = monacoModule;
    isMonacoLoading.value = false;
    
    // 加载成功后注册语言并初始化编辑器
    registerSqlLanguage();
    initEditor();
  } catch (error) {
    console.error('Failed to load Monaco Editor:', error);
    isMonacoLoading.value = false;
    loadError.value = error instanceof Error ? error.message : String(error);
  }
}

// 注册SQL语言
function registerSqlLanguage() {
  if (!monaco.value) return;
  
  // 注册SQL关键字
  monaco.value.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      // SQL关键字建议
      const suggestions: any[] = [
        // 关键字
        { label: 'SELECT', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'SELECT', range },
        { label: 'FROM', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'FROM', range },
        { label: 'WHERE', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'WHERE', range },
        { label: 'JOIN', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'JOIN', range },
        { label: 'LEFT JOIN', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'LEFT JOIN', range },
        { label: 'RIGHT JOIN', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'RIGHT JOIN', range },
        { label: 'INNER JOIN', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'INNER JOIN', range },
        { label: 'GROUP BY', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'GROUP BY', range },
        { label: 'ORDER BY', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'ORDER BY', range },
        { label: 'HAVING', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'HAVING', range },
        { label: 'LIMIT', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'LIMIT', range },
        { label: 'INSERT INTO', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'INSERT INTO', range },
        { label: 'UPDATE', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'UPDATE', range },
        { label: 'DELETE FROM', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'DELETE FROM', range },
        { label: 'CREATE TABLE', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'CREATE TABLE', range },
        { label: 'ALTER TABLE', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'ALTER TABLE', range },
        { label: 'DROP TABLE', kind: monaco.value.languages.CompletionItemKind.Keyword, insertText: 'DROP TABLE', range },
        
        // 函数
        { label: 'COUNT', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'COUNT($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'SUM', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'SUM($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'AVG', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'AVG($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'MAX', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'MAX($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'MIN', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'MIN($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'CONCAT', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'CONCAT($1, $2)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'SUBSTRING', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'SUBSTRING($1, $2, $3)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'UPPER', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'UPPER($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'LOWER', kind: monaco.value.languages.CompletionItemKind.Function, insertText: 'LOWER($1)', range, insertTextRules: monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet }
      ];
      
      // 添加表建议
      if (props.databaseTables.length > 0) {
        props.databaseTables.forEach(table => {
          suggestions.push({
            label: table,
            kind: monaco.value.languages.CompletionItemKind.Class,
            insertText: table,
            range,
            detail: '表'
          });
        });
      }
      
      // 添加列建议
      const lineText = model.getLineContent(position.lineNumber);
      const beforeText = lineText.substring(0, position.column - 1);
      
      // 识别当前上下文中的表名
      const tableContext = identifyTable(beforeText);
      if (tableContext && props.databaseColumns[tableContext]) {
        props.databaseColumns[tableContext].forEach(column => {
          suggestions.push({
            label: column,
            kind: monaco.value.languages.CompletionItemKind.Field,
            insertText: column,
            range,
            detail: `${tableContext} 表的列`
          });
        });
      }
      
      return { suggestions };
    }
  });
  
  // 注册格式化提供程序
  monaco.value.languages.registerDocumentFormattingEditProvider('sql', {
    provideDocumentFormattingEdits: (model: any) => {
      const text = model.getValue();
      const formatted = sqlFormatter.formatSql(text);
      
      return [
        {
          range: model.getFullModelRange(),
          text: formatted
        }
      ];
    }
  });
}

// 识别SQL语句中当前上下文的表名
function identifyTable(text: string): string | null {
  // 从FROM或JOIN语句中识别表名
  const fromMatch = text.match(/FROM\s+([^\s,;()]+)/i);
  const joinMatch = text.match(/JOIN\s+([^\s,;()]+)/i);
  
  if (fromMatch) return fromMatch[1];
  if (joinMatch) return joinMatch[1];
  
  return null;
}

// 初始化编辑器
function initEditor() {
  if (!editorContainer.value || !monaco.value) return;
  
  // 配置编辑器选项
  const options: any = {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    roundedSelection: true,
    scrollBeyondLastLine: false,
    readOnly: props.readOnly,
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    suggestOnTriggerCharacters: true,
    snippetSuggestions: 'inline',
    contextmenu: true,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  };
  
  // 创建编辑器实例
  editor.value = monaco.value.editor.create(editorContainer.value, options);
  
  // 监听内容变化
  editor.value.onDidChangeModelContent(() => {
    const value = editor.value?.getValue() || '';
    emit('update:modelValue', value);
  });
  
  // 添加执行快捷键 (Ctrl+Enter 或 Cmd+Enter)
  editor.value.addCommand(monaco.value.KeyMod.CtrlCmd | monaco.value.KeyCode.Enter, () => {
    emit('execute-query');
  });
  
  // 通知编辑器已挂载
  emit('editor-mounted', editor.value);
}

// 生命周期钩子
onMounted(() => {
  // 加载Monaco编辑器
  loadMonaco();
});

// 监听值变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getValue() !== newValue) {
    editor.value.setValue(newValue);
  }
});

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  if (monaco.value) {
    monaco.value.editor.setTheme(newTheme);
  }
});

// 组件卸载前清理
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.dispose();
  }
});

// 公开的方法
defineExpose({
  formatSql: () => {
    if (editor.value) {
      const formatted = sqlFormatter.formatSql(editor.value.getValue());
      editor.value.setValue(formatted);
    }
  },
  getEditor: () => editor.value,
  focus: () => {
    editor.value?.focus();
  }
});
</script>

<style scoped>
.sql-editor {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  position: relative;
}

.monaco-editor-container {
  height: 100%;
  width: 100%;
}

.loading-container,
.error-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

.dark .loading-container,
.dark .error-container {
  background-color: #1e1e1e;
  color: #d4d4d4;
}

:deep(.loading) {
  font-size: 32px;
  color: #409eff;
  animation: loading-rotate 2s linear infinite;
}

@keyframes loading-rotate {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}

:deep(.monaco-editor) {
  padding: 8px 0;
}
</style> 