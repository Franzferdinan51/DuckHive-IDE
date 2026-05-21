import React, { useState } from 'react';
import type { PanelId } from './IDE';

interface PanelProps {
  height: number;
  onHeightChange: (height: number) => void;
  panelId: PanelId;
  onPanelChange: (panelId: PanelId) => void;
  content: Array<{ type: string; content: string }>;
  onSubmit: (cmd: string) => void;
  input: string;
  onInputChange: (input: string) => void;
}

const PANELS: Array<{ id: PanelId; label: string; icon: string }> = [
  { id: 'terminal', label: 'Terminal', icon: '⌨' },
  { id: 'output', label: 'Output', icon: '📋' },
  { id: 'problems', label: 'Problems', icon: '⚠' },
  { id: 'console', label: 'Debug Console', icon: '🐞' },
  { id: 'ai-agent', label: 'AI Agent', icon: '🤖' },
];

export function Panel({ height, onHeightChange, panelId, onPanelChange, content, onSubmit, input, onInputChange }: PanelProps) {
  return (
    <div className="panel" style={{ height }}>
      {/* Resize Handle */}
      <div
        className="panel-resize-handle"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = height;
          const onMove = (ev: MouseEvent) => {
            const newHeight = Math.max(100, Math.min(500, startHeight - (ev.clientY - startY)));
            onHeightChange(newHeight);
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      />

      {/* Tab Bar */}
      <div className="panel-tabs">
        {PANELS.map(p => (
          <button
            key={p.id}
            className={`panel-tab ${panelId === p.id ? 'active' : ''}`}
            onClick={() => onPanelChange(p.id)}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="panel-content">
        {panelId === 'terminal' && (
          <div className="terminal-content">
            <div className="terminal-output">
              {content.map((line, i) => (
                <div key={i} className={`terminal-line ${line.type}`}>
                  {line.type === 'prompt' && <span className="terminal-prompt">$</span>}
                  <span>{line.content}</span>
                </div>
              ))}
            </div>
            <div className="terminal-input-container">
              <span className="terminal-prompt">$</span>
              <input
                type="text"
                className="terminal-input"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onSubmit(input);
                  }
                }}
                placeholder="Type a command..."
              />
            </div>
          </div>
        )}

        {panelId === 'ai-agent' && (
          <div className="ai-agent-content">
            <div className="ai-agent-header">
              <span className="ai-agent-icon">🤖</span>
              <div>
                <div className="ai-agent-title">Agent Session</div>
                <div className="ai-agent-status">Running - Idle</div>
              </div>
            </div>
            <div className="ai-agent-tools">
              <div className="ai-tool">
                <span className="ai-tool-name">read</span>
                <span className="ai-tool-desc">Read file contents</span>
              </div>
              <div className="ai-tool">
                <span className="ai-tool-name">write</span>
                <span className="ai-tool-desc">Write file contents</span>
              </div>
              <div className="ai-tool">
                <span className="ai-tool-name">bash</span>
                <span className="ai-tool-desc">Execute shell commands</span>
              </div>
              <div className="ai-tool">
                <span className="ai-tool-name">spawn</span>
                <span className="ai-tool-desc">Spawn sub-agent</span>
              </div>
            </div>
          </div>
        )}

        {(panelId === 'output' || panelId === 'problems' || panelId === 'console') && (
          <div className="panel-placeholder">
            <span>{PANELS.find(p => p.id === panelId)?.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}