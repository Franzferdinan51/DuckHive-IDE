/**
 * ChatProvider - WebView provider for the chat panel
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DuckHiveChannel, ChannelMessage } from './duckHiveChannel';

export class ChatProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  private channel: DuckHiveChannel;
  private webview?: vscode.WebviewView;

  constructor(context: vscode.ExtensionContext, channel: DuckHiveChannel) {
    this.context = context;
    this.channel = channel;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.webview = webviewView;

    // Configure the webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'src'))
      ]
    };

    // Set the HTML content
    webviewView.webview.html = this.getHtml();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });

    // Listen for responses from the channel
    this.channel.onMessage((message) => {
      webviewView.webview.postMessage(message);
    });
  }

  private handleMessage(message: { type: string; payload: unknown }): void {
    switch (message.type) {
      case 'chat':
        this.channel.sendMessage({
          type: 'chat',
          payload: {
            text: (message.payload as { text?: string })?.text || '',
            workspace: this.channel.getWorkspacePath()
          }
        });
        break;

      case 'clear':
        this.webview?.webview.postMessage({ type: 'clear', payload: {} });
        break;
    }
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DuckHive Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 12px 16px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-icon { font-size: 18px; }
    .header-title { font-weight: 600; font-size: 14px; }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      display: flex;
      gap: 10px;
      max-width: 90%;
    }
    .message.user { align-self: flex-end; flex-direction: row-reverse; }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #21262d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .message.assistant .avatar { background: linear-gradient(135deg, #ff9500, #ff6b00); color: white; }
    .content {
      background: #161b22;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #30363d;
      font-size: 13px;
      line-height: 1.5;
    }
    .message.user .content {
      background: #388bfd;
      border-color: #388bfd;
      color: white;
    }
    .input-area {
      padding: 12px 16px;
      background: #161b22;
      border-top: 1px solid #30363d;
    }
    .input-row {
      display: flex;
      gap: 8px;
    }
    textarea {
      flex: 1;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 10px 12px;
      color: #e6edf3;
      font-family: inherit;
      font-size: 13px;
      resize: none;
      min-height: 40px;
      max-height: 120px;
      outline: none;
    }
    textarea:focus { border-color: #58a6ff; }
    button {
      width: 40px;
      height: 40px;
      background: #58a6ff;
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    button:hover { background: #388bfd; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6e7681;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-icon">D</span>
    <span class="header-title">DuckHive Chat</span>
  </div>
  <div class="messages" id="messages">
    <div class="empty">
      <div style="font-size: 24px;">D</div>
      <div>Start a conversation</div>
    </div>
  </div>
  <div class="input-area">
    <div class="input-row">
      <textarea id="input" placeholder="Ask DuckHive to help..." rows="1"></textarea>
      <button id="send">➤</button>
    </div>
  </div>
  <script>
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');

    let conversation = [];

    function addMessage(role, content) {
      conversation.push({ role, content });
      const empty = messages.querySelector('.empty');
      if (empty) empty.remove();

      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.innerHTML = '<div class="avatar">' + (role === 'user' ? 'U' : 'D') + '</div>' +
                      '<div class="content">' + escapeHtml(content) + '</div>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function escapeHtml(text) {
      return text.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]));
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    sendBtn.addEventListener('click', send);

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMessage('user', text);
      input.value = '';
      input.style.height = 'auto';

      // Send to extension
      vscode.postMessage({ type: 'chat', payload: { text } });

      // Simulate thinking
      setTimeout(() => {
        addMessage('assistant', 'Processing your request...');
      }, 300);
    }

    // Listen for responses
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'response') {
        const msgs = messages.querySelectorAll('.message.assistant');
        const last = msgs[msgs.length - 1];
        if (last) last.querySelector('.content').textContent = message.payload.content;
      }
    });
  </script>
</body>
</html>`;
  }
}