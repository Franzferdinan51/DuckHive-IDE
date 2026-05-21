/**
 * DuckHive-IDE VS Code Extension
 *
 * Provides AI-first IDE features directly in VS Code:
 * - Inline chat for code explanation
 * - CodeLens actions for AI-assisted coding
 * - Chat panel for agent communication
 * - Council integration for code review
 */

import * as vscode from 'vscode';
import { ChatProvider } from './chatProvider';
import { InlineChatProvider } from './inlineChatProvider';
import { CouncilProvider } from './councilProvider';
import { DuckHiveChannel } from './duckHiveChannel';

// ============ Extension Lifecycle ============

let chatProvider: ChatProvider | undefined;
let inlineChatProvider: InlineChatProvider | undefined;
let councilProvider: CouncilProvider | undefined;
let channel: DuckHiveChannel | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('DuckHive-IDE extension activating...');

  // Initialize the communication channel to Tauri backend
  channel = new DuckHiveChannel(context);

  // Register chat provider for the webview panel
  chatProvider = new ChatProvider(context, channel);
  vscode.window.registerWebviewViewProvider('duckhive-chat', chatProvider);

  // Register inline chat handler
  inlineChatProvider = new InlineChatProvider(channel);
  context.subscriptions.push(
    vscode.chat.createChatParticipant('duckhive.inline', inlineChatProvider)
  );

  // Register council provider for code review
  councilProvider = new CouncilProvider(channel);
  context.subscriptions.push(
    vscode.commands.registerCommand('duckhive-ide.council', () => {
      councilProvider?.invokeCouncil();
    })
  );

  // Register main commands
  context.subscriptions.push(
    vscode.commands.registerCommand('duckhive-ide.start', () => {
      vscode.window.showInformationMessage('DuckHive-IDE started!');
      channel?.sendMessage({ type: 'start', payload: {} });
    }),
    vscode.commands.registerCommand('duckhive-ide.chat', () => {
      vscode.commands.executeCommand('duckhive-panel.focus');
    }),
    vscode.commands.registerCommand('duckhive-ide.inline', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        inlineChatProvider?.invokeInline(selectedText);
      }
    }),
    vscode.commands.registerCommand('duckhive-ide.spawn', () => {
      vscode.window.showInformationMessage('Spawning new agent...');
    }),
    vscode.commands.registerCommand('duckhive-ide.config', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'duckhive');
    })
  );

  // Register codeLens for AI-assisted actions
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', languages: ['typescript', 'javascript', 'python', 'rust', 'go'] },
      new CodeLensProvider()
    )
  );

  console.log('DuckHive-IDE extension activated');
}

export function deactivate() {
  chatProvider?.dispose();
  inlineChatProvider?.dispose();
  councilProvider?.dispose();
  channel?.dispose();
}

// ============ CodeLens Provider ============

class CodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const lineCount = Math.min(document.lineCount, 100); // Limit for performance

    // Add code lens for function definitions
    for (let i = 0; i < lineCount; i++) {
      const line = document.lineAt(i);
      const match = line.text.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
      if (match) {
        const range = new vscode.Range(i, 0, i, line.text.length);
        lenses.push(
          new vscode.CodeLens(range, {
            title: '🤖 DuckHive',
            command: 'duckhive-ide.inline',
            arguments: [document.uri.toString(), line.text]
          })
        );
      }
    }

    return lenses;
  }

  resolveCodeLens?(codeLens: vscode.CodeLens): vscode.CodeLens {
    return codeLens;
  }
}