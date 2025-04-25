const { contextBridge, ipcRenderer } = require('electron');
const path = require('node:path');

// 数据库服务 IPC 通道
const dbChannels = [
  'db:test-connection',
  'db:connect',
  'db:disconnect',
  'db:get-objects',
  'db:get-table-columns',
  'db:execute-query',
  'db:get-procedure-definition',
  'db:get-databases',
  'db:change-database'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ['message-from-renderer'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['message-from-main'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: async (channel, data) => {
    // 允许的 IPC 通道列表
    const validChannels = [
      'invoke-example',
      ...dbChannels
    ];
    
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    return null;
  }
}); 