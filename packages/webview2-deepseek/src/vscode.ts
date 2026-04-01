/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * VSCode Extension Module for DeepSeek Chat
 *
 * This module can be imported by any VSCode extension to add
 * DeepSeek Chat integration with auto-start capability.
 */

import * as vscode from 'vscode';
import { DeepSeekChatIDE, getExistingServer, autoStart, ServerInfo } from './ide.js';

let chatInstance: DeepSeekChatVSCode | null = null;
let chatViewProvider: DeepSeekChatViewProvider | null = null;

export interface DeepSeekChatVSCodeOptions {
  port?: number;
  workspace?: string;
  host?: string;
  lockFilePath?: string;
}

/**
 * Activate DeepSeek Chat integration in VSCode
 */
export async function activateDeepSeekChat(
  context: vscode.ExtensionContext,
  options: DeepSeekChatVSCodeOptions = {}
): Promise<DeepSeekChatVSCode> {
  if (chatInstance) {
    return chatInstance;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

  chatInstance = new DeepSeekChatVSCode(context, {
    workspace: workspaceFolder,
    ...options
  });

  await chatInstance.start();

  // Register chat view provider
  chatViewProvider = new DeepSeekChatViewProvider(context.extensionUri, chatInstance);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('deepseek-chat.view', chatViewProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('deepseek-chat.open', () => chatInstance!.openChat()),
    vscode.commands.registerCommand('deepseek-chat.focus', () => chatInstance!.focusChat()),
    vscode.commands.registerCommand('deepseek-chat.newConversation', () => chatInstance!.newConversation()),
    vscode.commands.registerCommand('deepseek-chat.stop', () => chatInstance!.stop())
  );

  return chatInstance;
}

/**
 * DeepSeek Chat VSCode Integration Class
 */
export class DeepSeekChatVSCode {
  private context: vscode.ExtensionContext;
  private chatIDE: DeepSeekChatIDE;
  private serverInfo: ServerInfo | null = null;
  private chatPanel: vscode.WebviewPanel | null = null;

  constructor(context: vscode.ExtensionContext, options: DeepSeekChatVSCodeOptions = {}) {
    this.context = context;
    this.chatIDE = new DeepSeekChatIDE({
      ...options,
      lockFilePath: options.lockFilePath || this.getLockFilePath(context)
    });
  }

  /**
   * Start the DeepSeek Chat server
   */
  async start(): Promise<ServerInfo> {
    this.serverInfo = await this.chatIDE.start();
    console.log(`[DeepSeekChat] Server started: ${this.serverInfo.url}`);
    return this.serverInfo;
  }

  /**
   * Stop the DeepSeek Chat server
   */
  async stop(): Promise<void> {
    await this.chatIDE.stop();
    this.serverInfo = null;
    if (this.chatPanel) {
      this.chatPanel.dispose();
      this.chatPanel = null;
    }
  }

  /**
   * Open the chat panel
   */
  openChat(): void {
    if (this.chatPanel) {
      this.chatPanel.reveal(vscode.ViewColumn.One);
    } else {
      this.createChatPanel();
    }
  }

  /**
   * Focus the chat panel
   */
  focusChat(): void {
    this.openChat();
  }

  /**
   * Create a new conversation
   */
  newConversation(): void {
    if (this.chatPanel) {
      this.chatPanel.dispose();
      this.chatPanel = null;
    }
    this.createChatPanel();
  }

  /**
   * Get server info
   */
  getServerInfo(): ServerInfo | null {
    return this.serverInfo;
  }

  /**
   * Create chat panel
   */
  private createChatPanel(): void {
    const panel = vscode.window.createWebviewPanel(
      'deepseekChat',
      'DeepSeek Chat',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'webview')
        ]
      }
    );

    panel.webview.html = this.getWebviewContent(panel.webview);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'ready':
            panel.webview.postMessage({
              type: 'serverInfo',
              data: this.serverInfo
            });
            break;
          case 'error':
            vscode.window.showErrorMessage(`DeepSeek Chat: ${message.message}`);
            break;
        }
      },
      undefined,
      []
    );

    panel.onDidDispose(() => {
      this.chatPanel = null;
    });

    this.chatPanel = panel;
  }

  /**
   * Get webview HTML content
   */
  private getWebviewContent(webview: vscode.Webview): string {
    const serverInfo = this.serverInfo;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepSeek Chat</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      height: 100vh;
      overflow: hidden;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
      gap: 16px;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--vscode-progressBar-background);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <div>Loading DeepSeek Chat...</div>
  </div>
  <iframe id="chatFrame" style="display:none" src="${serverInfo?.url || ''}"></iframe>
  <script>
    const vscode = acquireVsCodeApi();
    const loading = document.getElementById('loading');
    const frame = document.getElementById('chatFrame');

    vscode.postMessage({ type: 'ready' });

    window.addEventListener('message', (event) => {
      const { type, data } = event.data;
      if (type === 'serverInfo') {
        loading.style.display = 'none';
        frame.style.display = 'block';
      }
    });

    frame.onload = () => {
      loading.style.display = 'none';
      frame.style.display = 'block';
    };
  </script>
</body>
</html>`;
  }

  /**
   * Get lock file path
   */
  private getLockFilePath(context: vscode.ExtensionContext): string | undefined {
    const storagePath = context.storageUri?.fsPath || context.globalStorageUri?.fsPath;
    if (storagePath) {
      return storagePath.replace(/\\/g, '/') + '/deepseek-chat.lock';
    }
    return undefined;
  }
}

/**
 * DeepSeek Chat View Provider for sidebar
 */
class DeepSeekChatViewProvider {
  private extensionUri: vscode.Uri;
  private chatInstance: DeepSeekChatVSCode;
  private view: vscode.WebviewView | null = null;

  constructor(extensionUri: vscode.Uri, chatInstance: DeepSeekChatVSCode) {
    this.extensionUri = extensionUri;
    this.chatInstance = chatInstance;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.chatInstance.getWebviewContent(webviewView.webview);
  }
}

export default {
  activateDeepSeekChat,
  DeepSeekChatVSCode
};
