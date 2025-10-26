import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { OverlayConfig, MonitorInfo } from '../shared/types';

// For ES modules we need to recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Default overlay configuration
let overlayConfig: OverlayConfig = {
  opacity: 95,
  clickThrough: false,
  alwaysOnTop: true,
  monitorIndex: 0,
};

// Register IPC handlers before creating window
const registerIPCHandlers = () => {
  // IPC handlers for overlay control
  ipcMain.handle('overlay:get-config', () => {
    return overlayConfig;
  });

  ipcMain.handle('overlay:set-opacity', (_event, opacity: number) => {
    if (!mainWindow) return false;
    overlayConfig.opacity = Math.max(0, Math.min(100, opacity));
    mainWindow.setOpacity(overlayConfig.opacity / 100);
    return true;
  });

  ipcMain.handle('overlay:set-click-through', (_event, enabled: boolean) => {
    if (!mainWindow) return false;
    overlayConfig.clickThrough = enabled;
    
    if (enabled) {
      // Enable click-through on transparent areas
      // forward-mouse makes clicks pass through on transparent areas
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      // Disable click-through
      mainWindow.setIgnoreMouseEvents(false);
    }
    
    return true;
  });

  ipcMain.handle('overlay:set-always-on-top', (_event, enabled: boolean) => {
    if (!mainWindow) return false;
    overlayConfig.alwaysOnTop = enabled;
    mainWindow.setAlwaysOnTop(enabled);
    return true;
  });

  ipcMain.handle('overlay:get-monitors', () => {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    const monitors: MonitorInfo[] = displays.map((display, index) => ({
      id: index,
      bounds: display.bounds,
      isPrimary: display.id === primaryDisplay.id,
    }));
    return monitors;
  });

  ipcMain.handle('overlay:set-monitor', (_event, monitorIndex: number) => {
    if (!mainWindow) return false;
    const displays = screen.getAllDisplays();
    
    if (monitorIndex < 0 || monitorIndex >= displays.length) {
      return false;
    }
    
    const targetDisplay = displays[monitorIndex];
    const { x, y, width, height } = targetDisplay.workArea;
    
    // Move window to the selected monitor
    mainWindow.setBounds({
      x: x + Math.floor((width - mainWindow.getBounds().width) / 2),
      y: y + Math.floor((height - mainWindow.getBounds().height) / 2),
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height,
    });
    
    overlayConfig.monitorIndex = monitorIndex;
    return true;
  });
};

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    transparent: true,
    frame: false,
    alwaysOnTop: overlayConfig.alwaysOnTop,
    skipTaskbar: false,
    resizable: true,
    movable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set initial opacity
  mainWindow.setOpacity(overlayConfig.opacity / 100);

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  // Register IPC handlers before creating window
  registerIPCHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
