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
  const opacityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load initial configuration
    const loadConfig = async () => {
      try {
        // Check if electronAPI is available
        if (!window.electronAPI || !window.electronAPI.overlay) {
          console.error('electronAPI.overlay is not available');
          return;
        }

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
    
    // Update local state immediately for responsive UI
    setConfig(prev => ({ ...prev, opacity }));
    
    // Debounce IPC call to avoid performance issues during dragging
    if (opacityTimeoutRef.current) {
      clearTimeout(opacityTimeoutRef.current);
    }
    
    opacityTimeoutRef.current = setTimeout(async () => {
      try {
        if (window.electronAPI?.overlay?.setOpacity) {
          await window.electronAPI.overlay.setOpacity(opacity);
        }
      } catch (error) {
        console.error('Failed to set opacity:', error);
      }
    }, 50); // 50ms debounce
  };

  const handleClickThroughToggle = async () => {
    const newValue = !config.clickThrough;
    setConfig({ ...config, clickThrough: newValue });
    try {
      if (window.electronAPI?.overlay?.setClickThrough) {
        await window.electronAPI.overlay.setClickThrough(newValue);
      }
    } catch (error) {
      console.error('Failed to set click-through:', error);
    }
  };

  const handleAlwaysOnTopToggle = async () => {
    const newValue = !config.alwaysOnTop;
    setConfig({ ...config, alwaysOnTop: newValue });
    try {
      if (window.electronAPI?.overlay?.setAlwaysOnTop) {
        await window.electronAPI.overlay.setAlwaysOnTop(newValue);
      }
    } catch (error) {
      console.error('Failed to set always-on-top:', error);
    }
  };

  const handleMonitorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monitorIndex = parseInt(e.target.value);
    setConfig({ ...config, monitorIndex });
    try {
      if (window.electronAPI?.overlay?.setMonitor) {
        await window.electronAPI.overlay.setMonitor(monitorIndex);
      }
    } catch (error) {
      console.error('Failed to set monitor:', error);
    }
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
