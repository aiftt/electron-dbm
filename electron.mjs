#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createServer } from 'vite';

async function main() {
  // 启动 Vite 开发服务器
  console.log('正在启动 Vite 开发服务器...');
  const server = await createServer();
  await server.listen();
  
  const port = server.config.server.port || 5173;
  const viteUrl = `http://localhost:${port}`;
  console.log(`Vite 开发服务器运行于: ${viteUrl}`);
  
  // 关闭之前可能存在的 Electron 进程
  console.log('正在启动 Electron...');
  
  // 设置环境变量并启动 Electron
  const electronEnv = {
    ...process.env,
    VITE_DEV_SERVER_URL: viteUrl,
    ELECTRON_ENABLE_LOGGING: 1,
    ELECTRON_ENABLE_STACK_DUMPING: 1
  };
  
  console.log(`VITE_DEV_SERVER_URL 设置为: ${viteUrl}`);
  
  const electronProcess = spawn('electron', ['.'], {
    stdio: 'inherit',
    env: electronEnv
  });
  
  // 处理进程退出
  electronProcess.on('exit', (code) => {
    console.log(`Electron 进程已退出，退出码: ${code}`);
    server.close();
    process.exit(code || 0);
  });
  
  // 处理错误
  electronProcess.on('error', (err) => {
    console.error('Electron 启动失败:', err);
    server.close();
    process.exit(1);
  });
  
  // 处理中断信号
  process.on('SIGINT', () => {
    console.log('接收到中断信号，正在关闭...');
    electronProcess.kill();
    server.close();
    process.exit(0);
  });
  
  console.log('开发环境启动完成，等待应用加载...');
}

main().catch(err => {
  console.error('启动应用失败:', err);
  process.exit(1);
}); 