import { useState, useEffect } from 'react';
import type { HotkeyConfig } from '../../shared/types';

export const useHotkeys = () => {
  const [hotkeyConfig, setHotkeyConfig] = useState<HotkeyConfig>({
    toggleActivatedMode: 'F1',
    captureScreen: 'F12',
  });
  
  const [activatedModeConfig, setActivatedModeConfig] = useState({
    opacity: 100,
    inactiveOpacity: 30,
  });
  
  const [isActivatedMode, setIsActivatedMode] = useState(false);

  useEffect(() => {
    // Load initial configuration
    const loadConfig = async () => {
      try {
        if (!window.electronAPI?.hotkeys) {
          console.error('electronAPI.hotkeys is not available');
          return;
        }

        const config = await window.electronAPI.hotkeys.getConfig();
        setHotkeyConfig(config);
        
        const modeConfig = await window.electronAPI.hotkeys.getActivatedModeConfig();
        setActivatedModeConfig(modeConfig);
        
        const state = await window.electronAPI.hotkeys.getActivatedModeState();
        setIsActivatedMode(state);
      } catch (error) {
        console.error('Failed to load hotkey configuration:', error);
      }
    };
    
    loadConfig();
    
    // Listen for activated mode changes
    if (window.electronAPI?.hotkeys?.onActivatedModeChanged) {
      window.electronAPI.hotkeys.onActivatedModeChanged((isActivated) => {
        setIsActivatedMode(isActivated);
      });
    }
  }, []);

  const updateHotkeyConfig = async (newConfig: HotkeyConfig) => {
    try {
      if (window.electronAPI?.hotkeys?.setConfig) {
        const result = await window.electronAPI.hotkeys.setConfig(newConfig);
        if (result.success) {
          setHotkeyConfig(newConfig);
          return { success: true };
        }
        return result;
      }
    } catch (error) {
      console.error('Failed to update hotkey config:', error);
      return { success: false, error: String(error) };
    }
    return { success: false, error: 'API not available' };
  };

  const updateActivatedModeConfig = async (config: { opacity: number; inactiveOpacity: number }) => {
    try {
      if (window.electronAPI?.hotkeys?.setActivatedModeConfig) {
        await window.electronAPI.hotkeys.setActivatedModeConfig(config);
        setActivatedModeConfig(config);
        return true;
      }
    } catch (error) {
      console.error('Failed to update activated mode config:', error);
      return false;
    }
    return false;
  };

  const toggleActivatedMode = async () => {
    try {
      if (window.electronAPI?.hotkeys?.toggleActivatedMode) {
        const newState = await window.electronAPI.hotkeys.toggleActivatedMode();
        setIsActivatedMode(newState);
        return newState;
      }
    } catch (error) {
      console.error('Failed to toggle activated mode:', error);
    }
    return isActivatedMode;
  };

  return {
    hotkeyConfig,
    activatedModeConfig,
    isActivatedMode,
    updateHotkeyConfig,
    updateActivatedModeConfig,
    toggleActivatedMode,
  };
};
