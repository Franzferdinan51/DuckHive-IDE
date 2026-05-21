import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../stores/agentStore';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, sessionStatus } = useAgentStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      await sendMessage(userInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <span className="panel-title">AI Chat</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {sessionStatus}
        </span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            gap: '12px'
          }}>
            <div style={{ fontSize: '32px' }}>D</div>
            <div>Start a conversation with DuckHive</div>
            <div style={{ fontSize: '12px' }}>
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask DuckHive to help with your code..."
            rows={1}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" className="spin">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`chat-message ${message.role}`}>
      <div className="chat-message-avatar">
        {message.role === 'user' ? 'U' : 'D'}
      </div>
      <div className="chat-message-content">
        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="chat-message-tool-calls">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className={`tool-call tool-call-status ${tc.status}`}>
                <span className="tool-call-icon">
                  {tc.status === 'executing' ? '⚡' : tc.status === 'completed' ? '✓' : tc.status === 'failed' ? '✗' : '○'}
                </span>
                <span className="tool-call-name">{tc.name}</span>
                <span className="tool-call-status">
                  {JSON.stringify(tc.arguments).slice(0, 50)}...
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}