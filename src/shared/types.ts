// Shared types for Tornado MCP Client

export interface OverlayConfig {
  opacity: number; // 0-100
  clickThrough: boolean;
  alwaysOnTop: boolean;
  monitorIndex: number;
}

export interface MonitorInfo {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isPrimary: boolean;
}

export interface HotkeyConfig {
  toggleActivatedMode: string; // e.g., 'F1' or 'CommandOrControl+Shift+I'
  captureScreen: string; // e.g., 'F12' or 'CommandOrControl+Shift+S'
}

export interface AppConfig {
  overlay: OverlayConfig;
  hotkeys: HotkeyConfig;
  activatedMode: {
    opacity: number; // Opacity when activated (default 100)
    inactiveOpacity: number; // Opacity when inactive (default 30)
  };
}
