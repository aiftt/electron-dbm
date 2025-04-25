/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    invoke: (channel: string, data?: any) => Promise<any>;
    send: (channel: string, data?: any) => void;
    receive: (channel: string, callback: (...args: any[]) => void) => void;
  }
} 