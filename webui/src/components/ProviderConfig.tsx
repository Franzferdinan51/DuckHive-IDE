/**
 * DuckHive-IDE Provider Configuration UI Component
 *
 * Provider settings panel for configuring LLM providers:
 * - MiniMax (default)
 * - OpenAI
 * - Anthropic
 * - Gemini
 * - Ollama (local)
 */

import React, { useState } from 'react';

export type ProviderType = 'minimax' | 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface ProviderCredentials {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ProviderState {
  defaultProvider: ProviderType;
  providers: Record<ProviderType, ProviderCredentials>;
  activeModel: Record<ProviderType, string>;
}

interface ProviderConfigProps {
  state: ProviderState;
  onChange: (state: ProviderState) => void;
}

const PROVIDER_INFO: Record<ProviderType, { name: string; icon: string; docs: string }> = {
  minimax: {
    name: 'MiniMax',
    icon: 'M',
    docs: 'https://platform.minimax.io/'
  },
  openai: {
    name: 'OpenAI',
    icon: 'O',
    docs: 'https://platform.openai.com/'
  },
  anthropic: {
    name: 'Anthropic Claude',
    icon: 'A',
    docs: 'https://console.anthropic.com/'
  },
  gemini: {
    name: 'Google Gemini',
    icon: 'G',
    docs: 'https://aistudio.google.com/'
  },
  ollama: {
    name: 'Ollama (Local)',
    icon: 'L',
    docs: 'https://ollama.com/'
  }
};

const DEFAULT_MODELS: Record<ProviderType, string[]> = {
  minimax: ['minimax-01', 'minimax-01-mini'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini', 'o1-preview'],
  anthropic: ['claude-4-sonnet', 'claude-4-opus', 'claude-3-5-sonnet', 'claude-3-5-haiku'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama: ['llama3', 'llama3.1', 'mistral', 'codellama', 'qwen2']
};

export function ProviderConfig({ state, onChange }: ProviderConfigProps) {
  const [testingConnection, setTestingConnection] = useState<ProviderType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<ProviderType, 'idle' | 'testing' | 'success' | 'failed'>>({
    minimax: 'idle',
    openai: 'idle',
    anthropic: 'idle',
    gemini: 'idle',
    ollama: 'idle'
  });

  const updateProvider = (type: ProviderType, updates: Partial<ProviderCredentials>) => {
    onChange({
      ...state,
      providers: {
        ...state.providers,
        [type]: { ...state.providers[type], ...updates }
      }
    });
  };

  const setDefaultProvider = (type: ProviderType) => {
    onChange({ ...state, defaultProvider: type });
  };

  const setActiveModel = (type: ProviderType, model: string) => {
    onChange({
      ...state,
      activeModel: { ...state.activeModel, [type]: model }
    });
  };

  const testConnection = async (type: ProviderType) => {
    setTestingConnection(type);
    setConnectionStatus(prev => ({ ...prev, [type]: 'testing' }));

    // Simulate connection test
    await new Promise(r => setTimeout(r, 1500));

    const success = Math.random() > 0.3; // Demo purposes
    setConnectionStatus(prev => ({ ...prev, [type]: success ? 'success' : 'failed' }));
    setTestingConnection(null);

    if (success) {
      setTimeout(() => {
        setConnectionStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
    }
  };

  return (
    <div className="provider-config">
      <div className="config-header">
        <h2>AI Provider Configuration</h2>
        <p>Configure your AI provider credentials and model preferences</p>
      </div>

      {/* Provider Selection */}
      <div className="provider-selector">
        <label>Default Provider</label>
        <div className="provider-tabs">
          {(Object.keys(PROVIDER_INFO) as ProviderType[]).map(type => (
            <button
              key={type}
              className={`provider-tab ${state.defaultProvider === type ? 'active' : ''}`}
              onClick={() => setDefaultProvider(type)}
            >
              <span className="provider-icon">{PROVIDER_INFO[type].icon}</span>
              <span className="provider-name">{PROVIDER_INFO[type].name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Settings */}
      <div className="provider-settings">
        {(Object.keys(PROVIDER_INFO) as ProviderType[]).map(type => (
          <div
            key={type}
            className={`provider-panel ${state.defaultProvider === type ? 'active' : 'hidden'}`}
          >
            <div className="provider-form">
              {/* API Key */}
              <div className="form-group">
                <label htmlFor={`apiKey-${type}`}>API Key</label>
                <input
                  id={`apiKey-${type}`}
                  type="password"
                  value={state.providers[type].apiKey}
                  onChange={e => updateProvider(type, { apiKey: e.target.value })}
                  placeholder={type === 'ollama' ? 'No API key needed for local' : 'Enter API key...'}
                  disabled={type === 'ollama'}
                />
                <span className="form-hint">
                  {type === 'ollama' ? 'Ollama uses local inference - no API key required' : 'Keep this secret!'}
                </span>
              </div>

              {/* Base URL */}
              <div className="form-group">
                <label htmlFor={`baseUrl-${type}`}>Base URL</label>
                <input
                  id={`baseUrl-${type}`}
                  type="url"
                  value={state.providers[type].baseUrl}
                  onChange={e => updateProvider(type, { baseUrl: e.target.value })}
                  placeholder={
                    type === 'minimax' ? 'https://api.minimax.io/v1' :
                    type === 'openai' ? 'https://api.openai.com/v1' :
                    type === 'anthropic' ? 'https://api.anthropic.com' :
                    type === 'gemini' ? 'https://generativelanguage.googleapis.com/v1' :
                    type === 'ollama' ? 'http://localhost:11434/v1' :
                    ''
                  }
                />
              </div>

              {/* Model Selection */}
              <div className="form-group">
                <label htmlFor={`model-${type}`}>Model</label>
                <select
                  id={`model-${type}`}
                  value={state.activeModel[type]}
                  onChange={e => setActiveModel(type, e.target.value)}
                >
                  {DEFAULT_MODELS[type].map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Test Connection */}
              <div className="form-group test-row">
                <button
                  className={`test-btn ${connectionStatus[type]}`}
                  onClick={() => testConnection(type)}
                  disabled={testingConnection !== null || connectionStatus[type] === 'testing'}
                >
                  {connectionStatus[type] === 'testing' ? 'Testing...' :
                   connectionStatus[type] === 'success' ? '✓ Connected' :
                   connectionStatus[type] === 'failed' ? '✗ Failed' :
                   'Test Connection'}
                </button>
                <a href={PROVIDER_INFO[type].docs} target="_blank" rel="noopener" className="docs-link">
                  Get API Key →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .provider-config {
          padding: 20px;
          max-width: 800px;
        }
        .config-header {
          margin-bottom: 24px;
        }
        .config-header h2 {
          font-size: 18px;
          margin-bottom: 4px;
        }
        .config-header p {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .provider-selector {
          margin-bottom: 20px;
        }
        .provider-selector label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .provider-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .provider-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s;
        }
        .provider-tab:hover {
          border-color: var(--text-muted);
        }
        .provider-tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        .provider-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }
        .provider-name {
          font-size: 13px;
          font-weight: 500;
        }
        .provider-settings {
          margin-top: 16px;
        }
        .provider-panel.hidden {
          display: none;
        }
        .provider-form {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group:last-child {
          margin-bottom: 0;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 14px;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent);
        }
        .form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-hint {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .test-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .test-btn {
          padding: 8px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 13px;
        }
        .test-btn:hover:not(:disabled) {
          background: var(--bg-hover);
        }
        .test-btn.success {
          background: var(--success);
          border-color: var(--success);
          color: white;
        }
        .test-btn.failed {
          background: var(--error);
          border-color: var(--error);
          color: white;
        }
        .test-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .docs-link {
          font-size: 13px;
          color: var(--accent);
          text-decoration: none;
        }
        .docs-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default ProviderConfig;