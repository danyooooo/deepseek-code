/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';

/**
 * DeepSeek Webview Panel
 * 
 * Opens DeepSeek chat in a dedicated editor panel (not sidebar)
 */
export class DeepSeekWebviewPanel {
  private panel: vscode.WebviewPanel | undefined;
  private deepseekUrl: string;
  private toolServerPort: number;

  constructor(
    private extensionUri: vscode.Uri,
    deepseekUrl: string,
    toolServerPort: number
  ) {
    this.deepseekUrl = deepseekUrl;
    this.toolServerPort = toolServerPort;
  }

  /**
   * Open or reveal the panel
   */
  open() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'deepseekWebview',
      'DeepSeek Chat',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.extensionUri]
      }
    );

    this.panel.webview.html = this.getHtmlContent();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this.handleMessage(message);
      }
    );

    // Handle panel disposal
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      []
    );
  }

  /**
   * Start a new conversation
   */
  newConversation() {
    if (this.panel) {
      this.panel.webview.postMessage({ type: 'new-conversation' });
    }
  }

  /**
   * Dispose the panel
   */
  dispose() {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }

  /**
   * Get HTML content for the webview
   */
  private getHtmlContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepSeek Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { 
      width: 100%; 
      height: 100%; 
      overflow: hidden;
      background: #1e1e1e;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
      gap: 16px;
      color: #cccccc;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #0e639c;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .toolbar {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      gap: 8px;
      padding: 8px;
      z-index: 100;
    }
    .toolbar button {
      background: #2d2d30;
      border: 1px solid #3c3c3c;
      color: #cccccc;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar button:hover {
      background: #3c3c3c;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="newConversation()">+ New Chat</button>
    <button onclick="refreshFrame()">⟳ Refresh</button>
  </div>
  
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <div>Loading DeepSeek Chat...</div>
  </div>
  
  <iframe 
    id="deepseekFrame" 
    src="${this.deepseekUrl}"
    style="display: none;"
    allow="clipboard-read; clipboard-write"
  ></iframe>

  <script>
    const vscode = acquireVsCodeApi();
    const loading = document.getElementById('loading');
    const frame = document.getElementById('deepseekFrame');

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'webview-ready' });

    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      if (type === 'new-conversation') {
        // Clear conversation (DeepSeek specific)
        frame.contentWindow?.postMessage({ type: 'clear-conversation' }, '${this.deepseekUrl}');
      }
      
      if (type === 'tool-result') {
        // Forward tool result to DeepSeek in iframe
        frame.contentWindow?.postMessage({
          type: 'tool-result',
          toolCallId: data.toolCallId,
          result: data.result
        }, '${this.deepseekUrl}');
      }
    });

    // Listen for tool calls from DeepSeek
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'tool-call') {
        console.log('[DeepSeek Panel] Tool call:', event.data);
        // Forward to extension host
        vscode.postMessage(event.data);
      }
    });

    // Hide loading when iframe loads
    frame.onload = () => {
      loading.style.display = 'none';
      frame.style.display = 'block';
    };

    // Toolbar functions
    function newConversation() {
      vscode.postMessage({ type: 'new-conversation' });
    }

    function refreshFrame() {
      frame.src = frame.src;
    }
  </script>
</body>
</html>`;
  }

  /**
   * Handle messages from webview
   */
  private async handleMessage(message: any) {
    console.log('[DeepSeek Panel] Message:', message);

    switch (message.type) {
      case 'webview-ready':
        console.log('[DeepSeek Panel] Webview ready');
        break;

      case 'tool-call':
        await this.handleToolCall(message);
        break;
    }
  }

  /**
   * Handle tool call from DeepSeek
   */
  private async handleToolCall(message: any) {
    const { toolCallId, toolName, params } = message;

    try {
      // Execute tool
      const result = await this.executeTool(toolName, params);

      // Send result back to webview
      this.panel?.webview.postMessage({
        type: 'tool-result',
        toolCallId,
        result
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DeepSeek Panel] Tool execution error:', errorMessage);

      this.panel?.webview.postMessage({
        type: 'tool-result',
        toolCallId,
        result: {
          success: false,
          error: errorMessage
        }
      });
    }
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolName: string, params: any) {
    // Import dynamically to avoid circular dependencies
    const { ToolBridge } = await import('./toolBridge');
    
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    const toolBridge = new ToolBridge({ workspace });
    await toolBridge.initialize();

    return await toolBridge.executeTool(toolName, params);
  }
}
