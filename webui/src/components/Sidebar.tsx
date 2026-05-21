import React from 'react';

interface SidebarButton {
  icon: string;
  label: string;
  shortcut: string;
}

const buttons: SidebarButton[] = [
  { icon: '💬', label: 'Chat', shortcut: 'Ctrl+Shift+A' },
  { icon: '📁', label: 'Explorer', shortcut: 'Ctrl+Shift+X' },
  { icon: '🖥️', label: 'Terminal', shortcut: 'Ctrl+Shift+T' },
  { icon: '🎨', label: 'Media', shortcut: 'Ctrl+Shift+M' },
  { icon: '👥', label: 'Council', shortcut: 'Ctrl+Shift+C' }
];

export function Sidebar() {
  const [active, setActive] = React.useState('chat');

  return (
    <div className="sidebar">
      {buttons.map((btn, idx) => (
        <div
          key={idx}
          className={`sidebar-btn ${active === btn.label.toLowerCase() ? 'active' : ''}`}
          onClick={() => setActive(btn.label.toLowerCase())}
          title={`${btn.label} (${btn.shortcut})`}
        >
          <span style={{ fontSize: '18px' }}>{btn.icon}</span>
        </div>
      ))}
    </div>
  );
}