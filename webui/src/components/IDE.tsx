import React, { useState, useCallback } from 'react';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { EditorGroup } from './EditorGroup';
import { Panel } from './Panel';
import { StatusBar } from './StatusBar';
import { TitleBar } from './TitleBar';
import { TabBar } from './TabBar';
import './IDE.css';

export type ViewletId = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'ai-chat' | 'ai-council';
export type PanelId = 'terminal' | 'output' | 'problems' | 'console' | 'ai-agent';

export interface EditorTab {
  id: string;
  label: string;
  dirty?: boolean;
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  expanded?: boolean;
}

const DEFAULT_FILES: FileItem[] = [
  {
    name: 'src',
    type: 'folder',
    path: 'src',
    expanded: true,
    children: [
      { name: 'agent-core.ts', type: 'file', path: 'src/agent-core.ts' },
      { name: 'tool-registry.ts', type: 'file', path: 'src/tool-registry.ts' },
      { name: 'memory', type: 'folder', path: 'src/memory', expanded: false, children: [
        { name: 'index.ts', type: 'file', path: 'src/memory/index.ts' }
      ]}
    ]
  },
  { name: 'webui', type: 'folder', path: 'webui', expanded: false, children: [
    { name: 'src', type: 'folder', path: 'webui/src', children: [
      { name: 'App.tsx', type: 'file', path: 'webui/src/App.tsx' }
    ]}
  ]},
  { name: 'package.json', type: 'file', path: 'package.json' },
  { name: 'README.md', type: 'file', path: 'README.md' }
];

const INITIAL_TABS: EditorTab[] = [
  { id: '1', label: 'App.tsx', dirty: false },
  { id: '2', label: 'agent-core.ts', dirty: true },
  { id: '3', label: 'package.json', dirty: false }
];

const INITIAL_TERMINAL_CONTENT = [
  { type: 'output', content: 'DuckHive-IDE terminal initialized' },
  { type: 'output', content: 'Type /help for available commands' },
  { type: 'prompt', content: '$' }
];

export function IDE() {
  // Layout state
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [panelHeight, setPanelHeight] = useState(200);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [panelVisible, setPanelVisible] = useState(true);
  const [panelId, setPanelId] = useState<PanelId>('terminal');

  // Editor state
  const [tabs, setTabs] = useState<EditorTab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState('1');
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);

  // Activity bar state
  const [activeViewlet, setActiveViewlet] = useState<ViewletId>('explorer');

  // Terminal state
  const [terminalContent, setTerminalContent] = useState(INITIAL_TERMINAL_CONTENT);
  const [terminalInput, setTerminalInput] = useState('');

  // AI state
  const [aiMessages, setAiMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: 'Hello! I am DuckHive AI. How can I help you build today?' }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Handlers
  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const handleTerminalSubmit = useCallback((cmd: string) => {
    setTerminalContent(prev => [
      ...prev,
      { type: 'input', content: cmd },
      { type: 'output', content: `Executing: ${cmd}...` },
      { type: 'prompt', content: '$' }
    ]);
    setTerminalInput('');
  }, []);

  const handleAiSubmit = useCallback((msg: string) => {
    setAiMessages(prev => [...prev, { role: 'user', content: msg }]);
    setAiInput('');
    // Simulate AI response
    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: `I can help with that! Let me analyze your request about: "${msg.slice(0, 50)}..."`
      }]);
    }, 800);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(v => !v);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelVisible(v => !v);
  }, []);

  return (
    <div className="ide-root">
      <TitleBar />

      <div className="ide-body">
        <ActivityBar
          activeViewlet={activeViewlet}
          onViewletChange={setActiveViewlet}
          onToggleSidebar={toggleSidebar}
        />

        {sidebarVisible && (
          <Sidebar
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            activeViewlet={activeViewlet}
            files={files}
            onFilesChange={setFiles}
            aiMessages={aiMessages}
            onAiSubmit={handleAiSubmit}
            aiInput={aiInput}
            onAiInputChange={setAiInput}
          />
        )}

        <div className="ide-main">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={handleTabClose}
          />

          <EditorGroup
            activeTabId={activeTabId}
            tabs={tabs}
          />

          {panelVisible && (
            <Panel
              height={panelHeight}
              onHeightChange={setPanelHeight}
              panelId={panelId}
              onPanelChange={setPanelId}
              content={terminalContent}
              onSubmit={handleTerminalSubmit}
              input={terminalInput}
              onInputChange={setTerminalInput}
            />
          )}
        </div>
      </div>

      <StatusBar
        panelVisible={panelVisible}
        onTogglePanel={togglePanel}
        panelId={panelId}
      />
    </div>
  );
}

export default IDE;