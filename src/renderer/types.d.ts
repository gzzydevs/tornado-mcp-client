export interface ElectronAPI {
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
