import type { OverlayConfig, MonitorInfo } from '../shared/types';

export interface ElectronAPI {
  platform: string;
  overlay: {
    getConfig: () => Promise<OverlayConfig>;
    setOpacity: (opacity: number) => Promise<boolean>;
    setClickThrough: (enabled: boolean) => Promise<boolean>;
    setAlwaysOnTop: (enabled: boolean) => Promise<boolean>;
    getMonitors: () => Promise<MonitorInfo[]>;
    setMonitor: (monitorIndex: number) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
