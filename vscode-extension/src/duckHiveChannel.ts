/**
 * DuckHiveChannel - Communication channel to Tauri backend
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'vscode';

export interface ChannelMessage {
  type: string;
  payload: unknown;
}

export class DuckHiveChannel {
  private context: vscode.ExtensionContext;
  private emitter = new EventEmitter<ChannelMessage>();
  private isConnected = false;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.connect();
  }

  private connect(): void {
    // In production, this would connect via WebSocket or Tauri IPC
    // For now, we use VS Code's state to simulate connection
    this.isConnected = true;
    console.log('DuckHiveChannel connected');
  }

  sendMessage(message: ChannelMessage): void {
    if (!this.isConnected) {
      console.warn('DuckHiveChannel: not connected');
      return;
    }

    console.log('DuckHiveChannel sending:', message);
    this.emitter.fire(message);

    // Simulate response for demo
    if (message.type === 'chat') {
      setTimeout(() => {
        this.emitter.fire({
          type: 'response',
          payload: {
            content: `DuckHive response to: ${(message.payload as { text?: string })?.text || 'message'}`,
            toolCalls: []
          }
        });
      }, 500);
    }
  }

  onMessage(handler: (message: ChannelMessage) => void): vscode.Disposable {
    return this.emitter.event(handler);
  }

  getWorkspacePath(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }

  getSelectedText(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return '';
    return editor.document.getText(editor.selection);
  }

  dispose(): void {
    this.emitter.dispose();
    this.isConnected = false;
  }
}