import { useState, useEffect, useRef } from 'react';
import type { OverlayConfig, MonitorInfo } from '../../shared/types';

export const useOverlayControls = () => {
  const [config, setConfig] = useState<OverlayConfig>({
    opacity: 95,
    clickThrough: false,
    alwaysOnTop: true,
    monitorIndex: 0,
  });
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const opacityTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Load initial configuration
    const loadConfig = async () => {
      try {
        const initialConfig = await window.electronAPI.overlay.getConfig();
        setConfig(initialConfig);
        
        const availableMonitors = await window.electronAPI.overlay.getMonitors();
        setMonitors(availableMonitors);
      } catch (error) {
        console.error('Failed to load overlay configuration:', error);
      }
    };
    
    loadConfig();
    
    // Cleanup timeout on unmount
    return () => {
      if (opacityTimeoutRef.current) {
        clearTimeout(opacityTimeoutRef.current);
      }
    };
  }, []);

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const opacity = parseInt(e.target.value);
    setConfig({ ...config, opacity });
    
    // Debounce IPC call to avoid performance issues during dragging
    if (opacityTimeoutRef.current) {
      clearTimeout(opacityTimeoutRef.current);
    }
    
    opacityTimeoutRef.current = setTimeout(() => {
      window.electronAPI.overlay.setOpacity(opacity);
    }, 50); // 50ms debounce
  };

  const handleClickThroughToggle = async () => {
    const newValue = !config.clickThrough;
    setConfig({ ...config, clickThrough: newValue });
    await window.electronAPI.overlay.setClickThrough(newValue);
  };

  const handleAlwaysOnTopToggle = async () => {
    const newValue = !config.alwaysOnTop;
    setConfig({ ...config, alwaysOnTop: newValue });
    await window.electronAPI.overlay.setAlwaysOnTop(newValue);
  };

  const handleMonitorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monitorIndex = parseInt(e.target.value);
    setConfig({ ...config, monitorIndex });
    await window.electronAPI.overlay.setMonitor(monitorIndex);
  };

  return {
    config,
    monitors,
    handleOpacityChange,
    handleClickThroughToggle,
    handleAlwaysOnTopToggle,
    handleMonitorChange,
  };
};
