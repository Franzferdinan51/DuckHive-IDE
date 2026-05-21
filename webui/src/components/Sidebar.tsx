import React, { useState, useCallback } from 'react';
import type { ViewletId, FileItem } from './IDE';

interface SidebarProps {
  width: number;
  onWidthChange: (width: number) => void;
  activeViewlet: ViewletId;
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  aiMessages: Array<{role: string, content: string}>;
  onAiSubmit: (msg: string) => void;
  aiInput: string;
  onAiInputChange: (input: string) => void;
}

const VIEW_TITLES: Record<ViewletId, string> = {
  explorer: 'Explorer',
  search: 'Search',
  git: 'Source Control',
  debug: 'Debug',
  extensions: 'Extensions',
  'ai-chat': 'AI Chat',
  'ai-council': 'AI Council',
};

export function Sidebar({ width, onWidthChange, activeViewlet, files, onFilesChange, aiMessages, onAiSubmit, aiInput, onAiInputChange }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = useCallback((path: string) => {
    const toggle = (items: FileItem[]): FileItem[] =>
      items.map(item => {
        if (item.type === 'folder') {
          if (item.path === path) {
            return { ...item, expanded: !item.expanded };
          }
          if (item.children) {
            return { ...item, children: toggle(item.children) };
          }
        }
        return item;
      });
    onFilesChange(toggle(files));
  }, [files, onFilesChange]);

  const getFileIcon = (item: FileItem): string => {
    if (item.type === 'folder') return item.expanded ? '📂' : '📁';
    const ext = item.name.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      ts: '🔷', tsx: '⚛', js: '🟨', jsx: '⚛',
      json: '📋', md: '📝', css: '🎨', html: '🌐',
      png: '🖼', jpg: '🖼', svg: '🎨',
    };
    return icons[ext || ''] || '📄';
  };

  const renderFileTree = (items: FileItem[], depth = 0) => (
    <div className="file-tree">
      {items.map(item => (
        <div key={item.path} className="file-tree-item" style={{ paddingLeft: depth * 12 }}>
          <div
            className={`file-tree-row ${item.type}`}
            onClick={() => item.type === 'folder' && toggleFolder(item.path)}
          >
            <span className="file-icon">{getFileIcon(item)}</span>
            <span className="file-name">{item.name}</span>
          </div>
          {item.type === 'folder' && item.expanded && item.children && (
            <div className="file-tree-children">
              {renderFileTree(item.children, depth + 1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="sidebar" style={{ width }}>
      {/* Resize Handle */}
      <div
        className="sidebar-resize-handle"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = width;
          const onMove = (ev: MouseEvent) => {
            const newWidth = Math.max(150, Math.min(400, startWidth + ev.clientX - startX));
            onWidthChange(newWidth);
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      />

      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">{VIEW_TITLES[activeViewlet]}</span>
        <div className="sidebar-actions">
          <button className="sidebar-action" title="New File">📄</button>
          <button className="sidebar-action" title="New Folder">📁</button>
        </div>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeViewlet === 'explorer' && (
          <>
            <div className="explorer-header">
              <span className="explorer-title">DuckHive-IDE</span>
              <div className="explorer-actions">
                <button className="icon-btn" title="Refresh">↻</button>
                <button className="icon-btn" title="Collapse All">⧉</button>
              </div>
            </div>
            <div className="explorer-search">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="explorer-tree">
              {renderFileTree(files)}
            </div>
          </>
        )}

        {activeViewlet === 'search' && (
          <div className="search-panel">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search in files..."
                className="search-input"
              />
              <div className="search-options">
                <button className="icon-btn">Aa</button>
                <button className="icon-btn">.*</button>
              </div>
            </div>
            <div className="search-results">
              <div className="search-placeholder">
                Enter a search term to find in files
              </div>
            </div>
          </div>
        )}

        {activeViewlet === 'git' && (
          <div className="git-panel">
            <div className="git-header">
              <span>Changes</span>
              <span className="git-badge">2</span>
            </div>
            <div className="git-changes">
              <div className="git-change">📝 src/council/index.ts</div>
              <div className="git-change">📝 webui/src/App.tsx</div>
            </div>
          </div>
        )}

        {activeViewlet === 'ai-chat' && (
          <div className="ai-chat-panel">
            <div className="ai-messages">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`ai-message ${msg.role}`}>
                  <div className="ai-message-avatar">
                    {msg.role === 'assistant' ? 'D' : 'U'}
                  </div>
                  <div className="ai-message-content">{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="ai-input-container">
              <textarea
                value={aiInput}
                onChange={e => onAiInputChange(e.target.value)}
                placeholder="Ask DuckHive AI..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onAiSubmit(aiInput);
                  }
                }}
              />
              <button onClick={() => onAiSubmit(aiInput)}>➤</button>
            </div>
          </div>
        )}

        {activeViewlet === 'ai-council' && (
          <div className="ai-council-panel">
            <div className="council-header">
              <h3>👥 AI Council</h3>
              <p>Multi-agent code review system</p>
            </div>
            <div className="council-categories">
              <div className="council-category">
                <div className="category-header" style={{ borderColor: '#f85149' }}>
                  <span>🔒 Security</span>
                  <span className="category-count">6</span>
                </div>
              </div>
              <div className="council-category">
                <div className="category-header" style={{ borderColor: '#3fb950' }}>
                  <span>⚡ Performance</span>
                  <span className="category-count">6</span>
                </div>
              </div>
              <div className="council-category">
                <div className="category-header" style={{ borderColor: '#58a6ff' }}>
                  <span>✨ Code Quality</span>
                  <span className="category-count">8</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeViewlet === 'debug' || activeViewlet === 'extensions') && (
          <div className="placeholder-panel">
            <div className="placeholder-icon">
              {activeViewlet === 'debug' ? '🐛' : '🧩'}
            </div>
            <div className="placeholder-text">
              {activeViewlet === 'debug' ? 'No debugging session' : 'No extensions installed'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}