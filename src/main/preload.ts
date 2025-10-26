import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is running!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add API methods here as needed
  platform: process.platform,
  
  // Overlay control APIs
  overlay: {
    getConfig: () => ipcRenderer.invoke('overlay:get-config'),
    setOpacity: (opacity: number) => ipcRenderer.invoke('overlay:set-opacity', opacity),
    setClickThrough: (enabled: boolean) => ipcRenderer.invoke('overlay:set-click-through', enabled),
    setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('overlay:set-always-on-top', enabled),
    getMonitors: () => ipcRenderer.invoke('overlay:get-monitors'),
    setMonitor: (monitorIndex: number) => ipcRenderer.invoke('overlay:set-monitor', monitorIndex),
  },
  
  // Hotkey control APIs
  hotkeys: {
    getConfig: () => ipcRenderer.invoke('hotkeys:get-config'),
    setConfig: (config: any) => ipcRenderer.invoke('hotkeys:set-config', config),
    getActivatedModeConfig: () => ipcRenderer.invoke('hotkeys:get-activated-mode-config'),
    setActivatedModeConfig: (config: any) => ipcRenderer.invoke('hotkeys:set-activated-mode-config', config),
    getActivatedModeState: () => ipcRenderer.invoke('hotkeys:get-activated-mode-state'),
    toggleActivatedMode: () => ipcRenderer.invoke('hotkeys:toggle-activated-mode'),
    onActivatedModeChanged: (callback: (isActivated: boolean) => void) => {
      ipcRenderer.on('activated-mode-changed', (_event, isActivated) => callback(isActivated));
    },
    onScreenshotCaptured: (callback: (dataUrl: string) => void) => {
      ipcRenderer.on('screenshot-captured', (_event, dataUrl) => callback(dataUrl));
    },
  },
});

console.log('electronAPI exposed successfully!');
