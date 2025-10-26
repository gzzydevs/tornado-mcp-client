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
});

console.log('electronAPI exposed successfully!');
