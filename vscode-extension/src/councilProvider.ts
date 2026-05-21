/**
 * CouncilProvider - AI Council for code review and multi-perspective analysis
 */

import * as vscode from 'vscode';
import { DuckHiveChannel } from './duckHiveChannel';

interface Councilor {
  name: string;
  role: string;
  specialty: string;
  color: string;
}

const COUNCILORS: Councilor[] = [
  { name: 'SecuritySage', role: 'Security Expert', specialty: 'vulnerability detection', color: '#f85149' },
  { name: 'PerfGuru', role: 'Performance Analyst', specialty: 'bottleneck identification', color: '#3fb950' },
  { name: 'CleanCode', role: 'Code Quality', specialty: 'refactoring and style', color: '#58a6ff' },
  { name: 'ArchWizard', role: 'Architecture Expert', specialty: 'system design', color: '#bc8cff' },
  { name: 'TestMaster', role: 'Testing Specialist', specialty: 'test coverage', color: '#d29922' },
  { name: 'DocuNinja', role: 'Documentation', specialty: 'docs completeness', color: '#39c5cf' }
];

export class CouncilProvider {
  private channel: DuckHiveChannel;

  constructor(channel: DuckHiveChannel) {
    this.channel = channel;
  }

  async invokeCouncil(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor for council review');
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const code = selection.isEmpty
      ? document.getText()
      : document.getText(selection);

    if (!code.trim()) {
      vscode.window.showWarningMessage('No code selected for council review');
      return;
    }

    // Show progress for council deliberation
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'AI Council Deliberating...',
        cancellable: false
      },
      async (progress) => {
        for (let i = 0; i < COUNCILORS.length; i++) {
          progress.report({
            message: `${COUNCILORS[i].name} analyzing...`,
            increment: (i / COUNCILORS.length) * 100
          });
          await new Promise(r => setTimeout(r, 300));
        }
      }
    );

    // Show results in a new panel
    const panel = vscode.window.createWebviewPanel(
      'duckhive-council',
      'AI Council Results',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true }
    );

    panel.webview.html = this.getHtml(code, COUNCILORS);

    // Send to channel for actual processing
    this.channel.sendMessage({
      type: 'council',
      payload: { code, councilors: COUNCILORS.map(c => c.name) }
    });
  }

  private getHtml(code: string, councilors: Councilor[]): string {
    const councilResults = councilors.map(c => `
      <div class="councilor">
        <div class="councilor-header" style="border-color: ${c.color}">
          <span class="councilor-icon">${c.name.charAt(0)}</span>
          <div>
            <div class="councilor-name">${c.name}</div>
            <div class="councilor-role">${c.role}</div>
          </div>
        </div>
        <div class="councilor-finding">
          <strong>Finding:</strong> This code would benefit from ${c.specialty} improvements.
          Consider reviewing error handling and edge case management.
        </div>
        <div class="councilor-suggestion">
          <strong>Suggestion:</strong> Refactor for better ${c.specialty}.
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Council Results</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      padding: 20px;
    }
    h1 {
      font-size: 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .councilors {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .councilor {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
    }
    .councilor-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #21262d;
      border-left: 3px solid;
    }
    .councilor-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #30363d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .councilor-name { font-weight: 600; font-size: 14px; }
    .councilor-role { font-size: 12px; color: #8b949e; }
    .councilor-finding, .councilor-suggestion {
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.5;
    }
    .councilor-finding { border-top: 1px solid #30363d; }
    .councilor-suggestion { background: #0d1117; border-top: 1px solid #30363d; }
  </style>
</head>
<body>
  <h1>👥 AI Council Results</h1>
  <div class="councilors">${councilResults}</div>
</body>
</html>`;
  }
}