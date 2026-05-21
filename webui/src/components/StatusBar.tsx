import React from 'react';

interface StatusBarProps {
  panelVisible: boolean;
  onTogglePanel: () => void;
  panelId: string;
}

export function StatusBar({ panelVisible, onTogglePanel, panelId }: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <div className="status-item">
          <span className="status-icon">☰</span>
          <span>main</span>
        </div>
        <div className="status-item">
          <span className="status-icon">↻</span>
          <span>0</span>
        </div>
        <div className="status-item clickable" onClick={onTogglePanel}>
          <span className="status-icon">{panelVisible ? '⌄' : '⌃'}</span>
          <span>{panelId}</span>
        </div>
      </div>

      <div className="statusbar-right">
        <div className="status-item">
          <span className="status-icon">🔷</span>
          <span>TypeScript</span>
        </div>
        <div className="status-item">
          <span>Ln 42, Col 18</span>
        </div>
        <div className="status-item">
          <span>UTF-8</span>
        </div>
        <div className="status-item">
          <span>Spaces: 2</span>
        </div>
        <div className="status-item ai-status">
          <span className="status-icon">🤖</span>
          <span>DuckHive AI</span>
        </div>
      </div>
    </div>
  );
}