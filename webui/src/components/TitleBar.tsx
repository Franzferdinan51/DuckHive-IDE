import React from 'react';

export function TitleBar() {
  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-icon">D</div>
        <div className="titlebar-menu">
          <button className="menu-item">File</button>
          <button className="menu-item">Edit</button>
          <button className="menu-item">View</button>
          <button className="menu-item">Go</button>
          <button className="menu-item">Run</button>
          <button className="menu-item">Terminal</button>
          <button className="menu-item">Help</button>
        </div>
      </div>
      <div className="titlebar-center">
        <span className="titlebar-title">DuckHive-IDE - AI-First IDE for Vibe Coding</span>
      </div>
      <div className="titlebar-right">
        <button className="window-btn" title="Minimize">─</button>
        <button className="window-btn" title="Maximize">□</button>
        <button className="window-btn close" title="Close">×</button>
      </div>
    </div>
  );
}