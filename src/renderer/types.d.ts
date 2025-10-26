import type { OverlayConfig, MonitorInfo, HotkeyConfig } from '../shared/types';

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
  hotkeys: {
    getConfig: () => Promise<HotkeyConfig>;
    setConfig: (config: HotkeyConfig) => Promise<{ success: boolean; error?: string }>;
    getActivatedModeConfig: () => Promise<{ opacity: number; inactiveOpacity: number }>;
    setActivatedModeConfig: (config: { opacity: number; inactiveOpacity: number }) => Promise<boolean>;
    getActivatedModeState: () => Promise<boolean>;
    toggleActivatedMode: () => Promise<boolean>;
    onActivatedModeChanged: (callback: (isActivated: boolean) => void) => void;
    onScreenshotCaptured: (callback: (dataUrl: string) => void) => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
