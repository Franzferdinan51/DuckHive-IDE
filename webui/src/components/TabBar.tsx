import React from 'react';
import type { PanelId, EditorTab } from './IDE';

interface TabBarProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
  return (
    <div className="tabbar">
      <div className="tabs-container">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabSelect(tab.id)}
          >
            <span className="tab-icon">📄</span>
            <span className="tab-label">{tab.label}</span>
            {tab.dirty && <span className="tab-dirty">●</span>}
            <button
              className="tab-close"
              onClick={e => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="tabs-actions">
        <button className="tabs-action" title="Close All">×</button>
      </div>
    </div>
  );
}