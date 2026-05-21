import React from 'react';
import { useAgentStore } from '../stores/agentStore';

export function StatusBar() {
  const { sessionStatus, provider, model, tokenUsage } = useAgentStore();

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-item">
          <span>●</span>
          <span>{sessionStatus}</span>
        </div>
        <div className="status-item">
          <span>Model: {model || 'minimax-01'}</span>
        </div>
      </div>
      <div className="status-bar-right">
        <div className="status-item">
          <span>Tokens: {tokenUsage}</span>
        </div>
        <div className="status-item">
          <span>Provider: {provider}</span>
        </div>
      </div>
    </div>
  );
}