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
