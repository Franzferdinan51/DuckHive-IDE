import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import type { EditorTab } from './IDE';

interface EditorGroupProps {
  activeTabId: string;
  tabs: EditorTab[];
}

const SAMPLE_CODE = `/**
 * DuckHive-IDE - AI-First IDE
 * Built with React + TypeScript + Tauri
 */

// AI AgentCore initialization
const agentCore = new AgentCore({
  provider: 'minimax',
  model: 'minimax-01',
  workspacePath: process.cwd()
});

// Start agent session
async function startSession() {
  const session = agentCore.createSession({
    model: 'minimax-01',
    provider: 'minimax'
  });

  console.log('DuckHive-IDE ready! 🤖');

  // Run agent loop
  await agentCore.run(session.id, 'Hello, DuckHive!');
}

// Initialize the AI Council (40 coding-focused councilors)
const council = new AICouncil();
council.createSession('Code Review', selectedCode);
`;

export function EditorGroup({ activeTabId, tabs }: EditorGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Monaco editor
    const editor = monaco.editor.create(containerRef.current, {
      value: SAMPLE_CODE,
      language: 'typescript',
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      formatOnType: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 10 }
    });

    editorRef.current = editor;

    // Define custom theme matching VS Code Dark+
    monaco.editor.defineTheme('duckhive-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#aeafad',
        'editorLineNumber.foreground': '#858585',
      }
    });

    monaco.editor.setTheme('duckhive-dark');

    return () => editor.dispose();
  }, []);

  return (
    <div className="editor-group">
      <div className="editor-container" ref={containerRef} />
    </div>
  );
}