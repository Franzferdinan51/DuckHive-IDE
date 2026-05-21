import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

// Configure Monaco workers
self.MonacoEnvironment = {
  getWorker: function (_workerId: string, label: string) {
    const getWorkerModule = (moduleUrl: string, label: string) => {
      return new Worker(self.MonacoEnvironment!.getWorkerUrl!(moduleUrl, label), {
        name: label,
        type: 'module'
      });
    };
    switch (label) {
      case 'json':
        return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
      case 'css':
      case 'scss':
      case 'less':
        return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
      case 'html':
      case 'handlebars':
      case 'razor':
        return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
      case 'typescript':
      case 'javascript':
        return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
      default:
        return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
    }
  }
};

export function EditorPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Monaco editor
    const editor = monaco.editor.create(containerRef.current, {
      value: `// Welcome to DuckHive-IDE
// Start coding and your AI assistant will help you

function greet(name: string): string {
  return \`Hello, \${name}! Ready to build something amazing?\`;
}

console.log(greet('Developer'));
`,
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
      renderWhitespace: 'selection' as const,
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      formatOnType: true
    });

    editorRef.current = editor;

    // Define custom theme
    monaco.editor.defineTheme('duckhive-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#ff9500'
      }
    });

    monaco.editor.setTheme('duckhive-dark');

    return () => {
      editor.dispose();
    };
  }, []);

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <span className="panel-title">Editor</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TypeScript</span>
        </div>
      </div>
      <div className="editor-container" ref={containerRef} />
    </div>
  );
}