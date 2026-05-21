import React from 'react';
import type { ViewletId } from './IDE';

interface ActivityBarProps {
  activeViewlet: ViewletId;
  onViewletChange: (viewlet: ViewletId) => void;
  onToggleSidebar: () => void;
}

const VIEWLETS: Array<{ id: ViewletId; icon: string; tooltip: string }> = [
  { id: 'explorer', icon: '📁', tooltip: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search', icon: '🔍', tooltip: 'Search (Ctrl+Shift+F)' },
  { id: 'git', icon: '🔀', tooltip: 'Source Control (Ctrl+Shift+G)' },
  { id: 'debug', icon: '🐛', tooltip: 'Run and Debug (Ctrl+Shift+D)' },
  { id: 'extensions', icon: '🧩', tooltip: 'Extensions (Ctrl+Shift+X)' },
];

const AI_VIEWLETS: Array<{ id: ViewletId; icon: string; tooltip: string }> = [
  { id: 'ai-chat', icon: '🤖', tooltip: 'AI Chat' },
  { id: 'ai-council', icon: '👥', tooltip: 'AI Council' },
];

export function ActivityBar({ activeViewlet, onViewletChange, onToggleSidebar }: ActivityBarProps) {
  return (
    <div className="activitybar">
      <div className="activitybar-top">
        {VIEWLETS.map(v => (
          <button
            key={v.id}
            className={`activity-item ${activeViewlet === v.id ? 'active' : ''}`}
            onClick={() => onViewletChange(v.id)}
            title={v.tooltip}
          >
            <span className="activity-icon">{v.icon}</span>
          </button>
        ))}
      </div>

      <div className="activitybar-middle">
        <div className="activitybar-divider" />
        {AI_VIEWLETS.map(v => (
          <button
            key={v.id}
            className={`activity-item ai-item ${activeViewlet === v.id ? 'active' : ''}`}
            onClick={() => onViewletChange(v.id)}
            title={v.tooltip}
          >
            <span className="activity-icon">{v.icon}</span>
          </button>
        ))}
      </div>

      <div className="activitybar-bottom">
        <button
          className="activity-item"
          onClick={onToggleSidebar}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <span className="activity-icon">☰</span>
        </button>
        <button className="activity-item" title="Accounts">
          <span className="activity-icon">👤</span>
        </button>
        <button className="activity-item" title="Settings">
          <span className="activity-icon">⚙</span>
        </button>
      </div>
    </div>
  );
}