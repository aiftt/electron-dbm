# Electron DBM 数据库管理工具

一个类似 Navicat 的数据库管理客户端，基于 Electron、Vue 3、Tailwind CSS 和 Element Plus 构建。

## 功能特点

- 连接 MySQL、PostgreSQL 和 SQLite 数据库
- 浏览数据库对象（表、视图、存储过程等）
- 执行 SQL 查询并高亮语法
- 查看和编辑表数据
- 导出和导入数据

## 技术栈

- **Electron**: 跨平台桌面框架
- **Vue 3**: 使用组合式 API 的前端框架
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Element Plus**: UI 组件库
- **TypeScript**: 类型安全的 JavaScript

## 开发指南

### 前置条件

- Node.js (v16 或更高版本)
- npm 或 yarn

### 环境搭建

```bash
# 克隆仓库
git clone https://github.com/aiftt/electron-dbm.git
cd electron-dbm

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建应用

```bash
# 生产环境构建
npm run build
```

这将在 `out` 目录中生成适用于您操作系统的可分发文件。

## 项目结构

```
electron-dbm/
├── .cursor/                 # Cursor 编辑器配置和项目规则
├── dist/                    # 构建输出目录
├── electron/                # Electron 主进程代码
├── src/                     # Vue 应用代码
│   ├── assets/              # 静态资源
│   ├── components/          # 可复用的 Vue 组件
│   ├── layouts/             # 应用布局
│   ├── pages/               # Vue 页面/视图
│   ├── router/              # Vue Router 配置
│   ├── services/            # API 和服务函数
│   ├── stores/              # Pinia 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.vue              # 根 Vue 组件
│   └── main.ts              # Vue 应用入口点
├── package.json             # 项目依赖和脚本
└── vite.config.ts           # Vite 配置
```

## 开发路线图

- 数据库连接管理
- 表浏览和编辑
- 高级查询编辑器，支持语法高亮
- 查询历史记录
- 数据导入/导出
- 可视化查询构建器

## 开发规范

本项目有严格的开发规范，详细内容请查看 `.cursor/rules` 目录中的各项规则文件。所有开发者必须遵循这些规则：

1. 所有团队成员均为中文开发者，团队内部交流必须使用中文
2. 所有文档、注释、提交信息必须使用中文编写
3. 代码审查意见和回应必须使用中文表达
4. 所有 AI 工具（如 Claude、ChatGPT 等）必须配置为使用中文回复

## 许可证

ISC 许可证
