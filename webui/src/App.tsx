import React from 'react';
import { ChatPanel } from './components/ChatPanel';
import { EditorPanel } from './components/EditorPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { ExplorerPanel } from './components/ExplorerPanel';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';

export default function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-title">
          <div className="app-header-logo">D</div>
          <span>DuckHive-IDE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Sidebar />

        <div className="panel-container">
          <ExplorerPanel />
          <EditorPanel />
          <ChatPanel />
        </div>

        <TerminalPanel />
      </main>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}