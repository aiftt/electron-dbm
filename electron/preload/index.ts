import { contextBridge, ipcRenderer } from 'electron';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name of the current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data: any) => {
    // whitelist channels
    const validChannels = ['message-from-renderer'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['message-from-main'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: async (channel: string, data: any) => {
    const validChannels = ['invoke-example'];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    return null;
  }
}); 