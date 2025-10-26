import { app, BrowserWindow, ipcMain, screen, globalShortcut, desktopCapturer } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { OverlayConfig, MonitorInfo, HotkeyConfig } from '../shared/types';

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

// Default hotkey configuration
let hotkeyConfig: HotkeyConfig = {
  toggleActivatedMode: 'F1',
  captureScreen: 'F12',
};

// Activated mode configuration
let activatedModeConfig = {
  opacity: 100,
  inactiveOpacity: 30,
};

// Track if activated mode is currently enabled
let isActivatedMode = false;

// Toggle activated mode (click-through + opacity)
const toggleActivatedMode = () => {
  if (!mainWindow) return;
  
  isActivatedMode = !isActivatedMode;
  
  if (isActivatedMode) {
    // Activated mode: make clickable and increase opacity
    overlayConfig.opacity = activatedModeConfig.opacity;
    overlayConfig.clickThrough = false;
    mainWindow.setOpacity(activatedModeConfig.opacity / 100);
    mainWindow.setIgnoreMouseEvents(false);
  } else {
    // Inactive mode: make click-through and decrease opacity
    overlayConfig.opacity = activatedModeConfig.inactiveOpacity;
    overlayConfig.clickThrough = true;
    mainWindow.setOpacity(activatedModeConfig.inactiveOpacity / 100);
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  }
  
  // Notify renderer about the state change
  mainWindow.webContents.send('activated-mode-changed', isActivatedMode);
  
  console.log(`Activated mode: ${isActivatedMode ? 'ON' : 'OFF'}`);
};

// Capture screen
const captureScreen = async () => {
  if (!mainWindow) return;
  
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    if (sources.length > 0) {
      // Send screenshot to renderer
      const screenshot = sources[0].thumbnail.toDataURL();
      mainWindow.webContents.send('screenshot-captured', screenshot);
      console.log('Screenshot captured');
    }
  } catch (error) {
    console.error('Failed to capture screen:', error);
  }
};

// Register global hotkeys
const registerGlobalHotkeys = () => {
  // Unregister all previous hotkeys
  globalShortcut.unregisterAll();
  
  // Register toggle activated mode hotkey
  try {
    const toggleRegistered = globalShortcut.register(hotkeyConfig.toggleActivatedMode, toggleActivatedMode);
    if (toggleRegistered) {
      console.log(`Hotkey registered: ${hotkeyConfig.toggleActivatedMode} for toggle activated mode`);
    } else {
      console.error(`Failed to register hotkey: ${hotkeyConfig.toggleActivatedMode}`);
    }
  } catch (error) {
    console.error(`Error registering toggle hotkey:`, error);
  }
  
  // Register capture screen hotkey
  try {
    const captureRegistered = globalShortcut.register(hotkeyConfig.captureScreen, captureScreen);
    if (captureRegistered) {
      console.log(`Hotkey registered: ${hotkeyConfig.captureScreen} for capture screen`);
    } else {
      console.error(`Failed to register hotkey: ${hotkeyConfig.captureScreen}`);
    }
  } catch (error) {
    console.error(`Error registering capture hotkey:`, error);
  }
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

  // Hotkey management handlers
  ipcMain.handle('hotkeys:get-config', () => {
    return hotkeyConfig;
  });

  ipcMain.handle('hotkeys:set-config', (_event, newConfig: HotkeyConfig) => {
    try {
      hotkeyConfig = newConfig;
      registerGlobalHotkeys();
      return { success: true };
    } catch (error) {
      console.error('Failed to set hotkey config:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('hotkeys:get-activated-mode-config', () => {
    return activatedModeConfig;
  });

  ipcMain.handle('hotkeys:set-activated-mode-config', (_event, config: { opacity: number; inactiveOpacity: number }) => {
    activatedModeConfig = config;
    return true;
  });

  ipcMain.handle('hotkeys:get-activated-mode-state', () => {
    return isActivatedMode;
  });

  ipcMain.handle('hotkeys:toggle-activated-mode', () => {
    toggleActivatedMode();
    return isActivatedMode;
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

  // Debug: log preload path
  console.log('Preload script path:', join(__dirname, 'preload.js'));
  console.log('Current __dirname:', __dirname);

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
  
  // Register global hotkeys after window is created
  registerGlobalHotkeys();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts on quit
  globalShortcut.unregisterAll();
});
