import { contextBridge, ipcRenderer } from 'electron';
import type { OverlayConfig, MonitorInfo } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add API methods here as needed
  platform: process.platform,
  
  // Overlay control APIs
  overlay: {
    getConfig: (): Promise<OverlayConfig> => ipcRenderer.invoke('overlay:get-config'),
    setOpacity: (opacity: number): Promise<boolean> => ipcRenderer.invoke('overlay:set-opacity', opacity),
    setClickThrough: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('overlay:set-click-through', enabled),
    setAlwaysOnTop: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('overlay:set-always-on-top', enabled),
    getMonitors: (): Promise<MonitorInfo[]> => ipcRenderer.invoke('overlay:get-monitors'),
    setMonitor: (monitorIndex: number): Promise<boolean> => ipcRenderer.invoke('overlay:set-monitor', monitorIndex),
  },
});
