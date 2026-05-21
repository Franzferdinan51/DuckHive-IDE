import React, { useState } from 'react';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

const initialFiles: FileItem[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      { name: 'index.ts', type: 'file' },
      { name: 'agent-core.ts', type: 'file' },
      { name: 'tools', type: 'folder', children: [
        { name: 'tool-registry.ts', type: 'file' }
      ]}
    ]
  },
  { name: 'package.json', type: 'file' },
  { name: 'README.md', type: 'file' }
];

export function ExplorerPanel() {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (name: string, type: 'file' | 'folder') => {
    if (type === 'folder') {
      return expandedFolders.has(name) ? '📂' : '📁';
    }
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'js':
      case 'jsx':
        return '🟨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  const renderFileTree = (items: FileItem[], path = '') => {
    return items.map((item) => {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      const isExpanded = expandedFolders.has(item.name);

      return (
        <div key={itemPath}>
          <div
            className={`explorer-item ${selectedFile === itemPath ? 'active' : ''}`}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.name);
              } else {
                setSelectedFile(itemPath);
              }
            }}
          >
            <span className="explorer-icon">{getFileIcon(item.name, item.type)}</span>
            <span style={{ flex: 1 }}>{item.name}</span>
          </div>
          {item.type === 'folder' && isExpanded && item.children && (
            <div style={{ marginLeft: '12px' }}>
              {renderFileTree(item.children, item.name)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="panel explorer-panel">
      <div className="panel-header">
        <span className="panel-title">Explorer</span>
      </div>
      <div className="explorer-tree">
        {renderFileTree(files)}
      </div>
    </div>
  );
}