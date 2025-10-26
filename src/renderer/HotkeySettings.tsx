import React, { useState } from 'react';
import { useHotkeys } from './hooks/useHotkeys';
import './HotkeySettings.css';

const HotkeySettings: React.FC = () => {
  const {
    hotkeyConfig,
    activatedModeConfig,
    isActivatedMode,
    updateHotkeyConfig,
    updateActivatedModeConfig,
    toggleActivatedMode,
  } = useHotkeys();
  
  const [editingToggleKey, setEditingToggleKey] = useState(false);
  const [editingCaptureKey, setEditingCaptureKey] = useState(false);
  const [tempToggleKey, setTempToggleKey] = useState('');
  const [tempCaptureKey, setTempCaptureKey] = useState('');
  const [error, setError] = useState('');

  const handleToggleKeyEdit = () => {
    setEditingToggleKey(true);
    setTempToggleKey(hotkeyConfig.toggleActivatedMode);
    setError('');
  };

  const handleCaptureKeyEdit = () => {
    setEditingCaptureKey(true);
    setTempCaptureKey(hotkeyConfig.captureScreen);
    setError('');
  };

  const saveToggleKey = async () => {
    if (!tempToggleKey.trim()) {
      setError('Hotkey cannot be empty');
      return;
    }

    const result = await updateHotkeyConfig({
      ...hotkeyConfig,
      toggleActivatedMode: tempToggleKey,
    });

    if (result.success) {
      setEditingToggleKey(false);
      setError('');
    } else {
      setError(result.error || 'Failed to register hotkey');
    }
  };

  const saveCaptureKey = async () => {
    if (!tempCaptureKey.trim()) {
      setError('Hotkey cannot be empty');
      return;
    }

    const result = await updateHotkeyConfig({
      ...hotkeyConfig,
      captureScreen: tempCaptureKey,
    });

    if (result.success) {
      setEditingCaptureKey(false);
      setError('');
    } else {
      setError(result.error || 'Failed to register hotkey');
    }
  };

  const handleActivatedOpacityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const opacity = parseInt(e.target.value);
    await updateActivatedModeConfig({
      ...activatedModeConfig,
      opacity,
    });
  };

  const handleInactiveOpacityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inactiveOpacity = parseInt(e.target.value);
    await updateActivatedModeConfig({
      ...activatedModeConfig,
      inactiveOpacity,
    });
  };

  return (
    <div className="hotkey-settings">
      <h3>⌨️ Hotkey Settings</h3>
      
      <div className="mode-indicator">
        <p className={`status ${isActivatedMode ? 'active' : 'inactive'}`}>
          Mode: {isActivatedMode ? '🟢 Activated (Clickable)' : '🔵 Inactive (Click-through)'}
        </p>
        <button onClick={toggleActivatedMode} className="toggle-button">
          Toggle Mode
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="control-group">
        <label>Toggle Activated Mode:</label>
        {editingToggleKey ? (
          <div className="hotkey-editor">
            <input
              type="text"
              value={tempToggleKey}
              onChange={(e) => setTempToggleKey(e.target.value)}
              placeholder="e.g., F1 or CommandOrControl+Shift+I"
              autoFocus
            />
            <button onClick={saveToggleKey} className="save-btn">Save</button>
            <button onClick={() => setEditingToggleKey(false)} className="cancel-btn">Cancel</button>
          </div>
        ) : (
          <div className="hotkey-display">
            <code>{hotkeyConfig.toggleActivatedMode}</code>
            <button onClick={handleToggleKeyEdit} className="edit-btn">Edit</button>
          </div>
        )}
        <p className="hint">Press this hotkey to toggle between clickable and click-through mode</p>
      </div>

      <div className="control-group">
        <label>Capture Screen:</label>
        {editingCaptureKey ? (
          <div className="hotkey-editor">
            <input
              type="text"
              value={tempCaptureKey}
              onChange={(e) => setTempCaptureKey(e.target.value)}
              placeholder="e.g., F12 or CommandOrControl+Shift+S"
              autoFocus
            />
            <button onClick={saveCaptureKey} className="save-btn">Save</button>
            <button onClick={() => setEditingCaptureKey(false)} className="cancel-btn">Cancel</button>
          </div>
        ) : (
          <div className="hotkey-display">
            <code>{hotkeyConfig.captureScreen}</code>
            <button onClick={handleCaptureKeyEdit} className="edit-btn">Edit</button>
          </div>
        )}
        <p className="hint">Press this hotkey to capture a screenshot</p>
      </div>

      <div className="control-group">
        <label htmlFor="active-opacity">
          Activated Mode Opacity: {activatedModeConfig.opacity}%
        </label>
        <input
          id="active-opacity"
          type="range"
          min="50"
          max="100"
          value={activatedModeConfig.opacity}
          onChange={handleActivatedOpacityChange}
          className="slider"
        />
        <p className="hint">Opacity when overlay is in activated mode (clickable)</p>
      </div>

      <div className="control-group">
        <label htmlFor="inactive-opacity">
          Inactive Mode Opacity: {activatedModeConfig.inactiveOpacity}%
        </label>
        <input
          id="inactive-opacity"
          type="range"
          min="10"
          max="70"
          value={activatedModeConfig.inactiveOpacity}
          onChange={handleInactiveOpacityChange}
          className="slider"
        />
        <p className="hint">Opacity when overlay is in inactive mode (click-through)</p>
      </div>

      <div className="hotkey-info">
        <p><strong>Hotkey Format Examples:</strong></p>
        <ul>
          <li><code>F1</code>, <code>F12</code> - Function keys</li>
          <li><code>CommandOrControl+Shift+I</code> - Modifier combinations</li>
          <li><code>Alt+Tab</code>, <code>Control+C</code> - With modifiers</li>
        </ul>
        <p className="warning">⚠️ Some hotkeys may conflict with system or game shortcuts</p>
      </div>
    </div>
  );
};

export default HotkeySettings;
