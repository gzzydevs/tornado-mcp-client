import React, { useState } from 'react';
import OverlayControls from './OverlayControls';
import HotkeySettings from './HotkeySettings';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <OverlayControls />
      
      <header className="App-header">
        <h1>🌪️ Tornado MCP Client</h1>
        <p>Universal AI overlay for video games</p>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/renderer/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="info">
          Electron + React + TypeScript + Vite
        </p>
        <p className="overlay-info">
          🎮 Transparent overlay with click-through support
        </p>
      </header>
      
      <HotkeySettings />
    </div>
  );
}

export default App;
