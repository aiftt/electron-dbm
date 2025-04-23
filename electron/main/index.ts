import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { release } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// import { update } from './update';

// Get the directory name of the current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

// Make sure only one instance is running
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Global reference to mainWindow to avoid it being garbage collected
let mainWindow: BrowserWindow | null = null;

// Here, we load the app URL
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const indexHtml = join(process.env.DIST || '', 'index.html');

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Electron DBM',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set window menu
  // mainWindow.setMenu(null);

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open devTools if in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexHtml);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
  // update();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// Handle IPC messages from renderer process
ipcMain.on('message-from-renderer', (event, message) => {
  console.log('Received message from renderer:', message);
  // Reply to renderer
  event.reply('message-from-main', 'Hello from the main process!');
}); 