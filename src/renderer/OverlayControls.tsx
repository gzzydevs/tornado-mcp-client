import React, { useState } from 'react';
import { useOverlayControls } from './hooks/useOverlayControls';
import './OverlayControls.css';

const OverlayControls: React.FC = () => {
  const {
    config,
    monitors,
    handleOpacityChange,
    handleClickThroughToggle,
    handleAlwaysOnTopToggle,
    handleMonitorChange,
  } = useOverlayControls();
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`overlay-controls ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>
      
      {!isCollapsed && (
        <div className="controls-content">
          <h3>🌪️ Overlay Settings</h3>
          
          <div className="control-group">
            <label htmlFor="opacity-slider">
              Opacity: {config.opacity}%
            </label>
            <input
              id="opacity-slider"
              type="range"
              min="0"
              max="100"
              value={config.opacity}
              onChange={handleOpacityChange}
              className="slider"
            />
          </div>

          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.clickThrough}
                onChange={handleClickThroughToggle}
              />
              <span>Click-through (transparent areas)</span>
            </label>
            <p className="hint">When enabled, clicks pass through transparent areas</p>
          </div>

          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.alwaysOnTop}
                onChange={handleAlwaysOnTopToggle}
              />
              <span>Always on top</span>
            </label>
          </div>

          {monitors.length > 1 && (
            <div className="control-group">
              <label htmlFor="monitor-select">Monitor:</label>
              <select
                id="monitor-select"
                value={config.monitorIndex}
                onChange={handleMonitorChange}
              >
                {monitors.map((monitor) => (
                  <option key={monitor.id} value={monitor.id}>
                    Monitor {monitor.id + 1} {monitor.isPrimary ? '(Primary)' : ''} - {monitor.bounds.width}x{monitor.bounds.height}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="status-info">
            <p>✓ Low FPS impact</p>
            <p>✓ Multi-monitor ready</p>
            <p>✓ Game-friendly overlay</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayControls;
