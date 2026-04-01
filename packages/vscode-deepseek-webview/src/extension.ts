/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Qwen Code DeepSeek WebView Extension
 *
 * Embeds https://chat.deepseek.com in VSCode with Qwen Code tool integration.
 *
 * Architecture:
 * 1. WebView panel loads DeepSeek chat in an iframe
 * 2. Tool API server runs locally (localhost:3456)
 * 3. DeepSeek tool calls are intercepted and executed via Qwen Code tools
 * 4. Results are returned to DeepSeek for continued conversation
 */

import * as vscode from 'vscode';
import { DeepSeekWebviewPanel } from './deepseekWebviewPanel';
import { ToolApiServer } from './toolApiServer';
import { ToolBridge } from './toolBridge';

let contextGlobal: vscode.ExtensionContext | undefined;
let toolServer: ToolApiServer | undefined;
let webviewPanel: DeepSeekWebviewPanel | undefined;

/**
 * Activate the extension
 */
export async function activate(context: vscode.ExtensionContext) {
  contextGlobal = context;
  
  console.log('[DeepSeek WebView] Extension is now active!');

  try {
    // Get configuration
    const config = vscode.workspace.getConfiguration('deepseek-webview');
    const autoStartServer = config.get('autoStartServer', true);
    const port = config.get('toolServerPort', 3456);
    const workspace = getWorkspacePath();

    // Start tool API server if auto-start is enabled
    if (autoStartServer) {
      await startToolServer(context, port, workspace);
    }

    // Create DeepSeek webview panel
    const deepseekUrl = config.get('url', 'https://chat.deepseek.com');
    webviewPanel = new DeepSeekWebviewPanel(
      context.extensionUri,
      deepseekUrl,
      port
    );

    // Register sidebar webview provider
    const sidebarProvider = new DeepSeekSidebarProvider(
      context.extensionUri,
      deepseekUrl,
      port
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'deepseek-webview.sidebar',
        sidebarProvider
      )
    );

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('deepseek-webview.open', () => {
        webviewPanel?.open();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('deepseek-webview.focus', () => {
        webviewPanel?.open();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('deepseek-webview.newConversation', () => {
        webviewPanel?.newConversation();
        vscode.window.showInformationMessage('New DeepSeek conversation started');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('deepseek-webview.startToolServer', async () => {
        await startToolServer(context, port, workspace);
      })
    );

    console.log(`[DeepSeek WebView] DeepSeek chat available at: ${deepseekUrl}`);
    console.log(`[DeepSeek WebView] Tool API server: http://localhost:${port}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeepSeek WebView] Activation error:', errorMessage);
    vscode.window.showErrorMessage(
      `Failed to activate DeepSeek WebView: ${errorMessage}`
    );
  }
}

/**
 * Start the tool API server
 */
async function startToolServer(
  context: vscode.ExtensionContext,
  port: number,
  workspace: string
) {
  try {
    if (toolServer && toolServer.isRunning) {
      console.log('[DeepSeek WebView] Tool server already running');
      return;
    }

    console.log(`[DeepSeek WebView] Starting tool API server on port ${port}...`);

    // Create tool bridge
    const toolBridge = new ToolBridge({ workspace });
    await toolBridge.initialize();

    // Create and start server
    toolServer = new ToolApiServer({
      toolBridge,
      port,
      workspace
    });

    await toolServer.start();

    console.log(`[DeepSeek WebView] Tool server started: http://localhost:${port}`);

    // Store server in context for disposal
    context.subscriptions.push({
      dispose: () => toolServer?.stop()
    });

    // Show notification
    vscode.window.showInformationMessage(
      `DeepSeek Tool API server started on port ${port}`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeepSeek WebView] Failed to start tool server:', errorMessage);
    vscode.window.showErrorMessage(
      `Failed to start tool server: ${errorMessage}. Check Output panel for details.`
    );
  }
}

/**
 * Get workspace path from configuration or active workspace
 */
function getWorkspacePath(): string {
  const config = vscode.workspace.getConfiguration('deepseek-webview');
  let workspace = config.get('workspace', '${workspaceFolder}');

  // Replace variables
  if (workspace.includes('${workspaceFolder}')) {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (folder) {
      workspace = workspace.replace('${workspaceFolder}', folder);
    } else {
      workspace = process.cwd();
    }
  }

  return workspace;
}

/**
 * DeepSeek Sidebar Provider
 */
class DeepSeekSidebarProvider implements vscode.WebviewViewProvider {
  constructor(
    private extensionUri: vscode.Uri,
    private deepseekUrl: string,
    private toolServerPort: number
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    // Set HTML content
    webviewView.webview.html = this.getWebviewContent();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.handleMessage(message, webviewView.webview);
    });
  }

  private getWebviewContent() {
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
      background: var(--vscode-editor-background);
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
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
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
  </style>
</head>
<body>
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
      
      if (type === 'server-info') {
        console.log('[DeepSeek] Tool server info:', data);
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
        // Forward to extension host
        vscode.postMessage(event.data);
      }
    });

    // Hide loading when iframe loads
    frame.onload = () => {
      loading.style.display = 'none';
      frame.style.display = 'block';
    };
  </script>
</body>
</html>`;
  }

  private async handleMessage(
    message: any,
    webview: vscode.Webview
  ) {
    switch (message.type) {
      case 'webview-ready':
        console.log('[DeepSeek Sidebar] Webview ready');
        // Send server info to webview
        if (toolServer) {
          webview.postMessage({
            type: 'server-info',
            data: {
              port: toolServer.port,
              url: `http://localhost:${toolServer.port}`
            }
          });
        }
        break;

      case 'tool-call':
        console.log('[DeepSeek Sidebar] Tool call:', message);
        // Handle tool execution
        await this.handleToolCall(message, webview);
        break;
    }
  }

  private async handleToolCall(
    message: any,
    webview: vscode.Webview
  ) {
    try {
      const { toolCallId, toolName, params } = message;

      // Get tool permissions
      const config = vscode.workspace.getConfiguration('deepseek-webview');
      const permissions = config.get('toolPermissions', {});
      const permission = (permissions as any)[toolName] || 'ask';

      // Check permission
      if (permission === 'deny') {
        webview.postMessage({
          type: 'tool-result',
          toolCallId,
          result: {
            success: false,
            error: `Tool '${toolName}' is denied by configuration`
          }
        });
        return;
      }

      if (permission === 'ask') {
        // Ask user for permission
        const action = await vscode.window.showWarningMessage(
          `DeepSeek wants to use '${toolName}'`,
          { modal: true },
          'Allow',
          'Deny',
          'Always Allow',
          'Always Deny'
        );

        if (action === 'Deny' || !action) {
          webview.postMessage({
            type: 'tool-result',
            toolCallId,
            result: {
              success: false,
              error: `Tool '${toolName}' was denied`
            }
          });
          return;
        }

        if (action === 'Always Allow') {
          // Update configuration
          const newPermissions = { ...permissions, [toolName]: 'allow' };
          await config.update('toolPermissions', newPermissions, vscode.ConfigurationTarget.Global);
        }

        if (action === 'Always Deny') {
          const newPermissions = { ...permissions, [toolName]: 'deny' };
          await config.update('toolPermissions', newPermissions, vscode.ConfigurationTarget.Global);
          webview.postMessage({
            type: 'tool-result',
            toolCallId,
            result: {
              success: false,
              error: `Tool '${toolName}' was denied`
            }
          });
          return;
        }
      }

      // Execute tool
      const result = await executeTool(toolName, params);

      // Send result back to webview
      webview.postMessage({
        type: 'tool-result',
        toolCallId,
        result
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DeepSeek Sidebar] Tool execution error:', errorMessage);

      webview.postMessage({
        type: 'tool-result',
        toolCallId: message.toolCallId,
        result: {
          success: false,
          error: errorMessage
        }
      });
    }
  }
}

/**
 * Execute a tool via ToolBridge
 */
async function executeTool(toolName: string, params: any) {
  // Create tool bridge if not exists
  const workspace = getWorkspacePath();
  const toolBridge = new ToolBridge({ workspace });
  await toolBridge.initialize();

  return await toolBridge.executeTool(toolName, params);
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  console.log('[DeepSeek WebView] Extension deactivated');
  
  if (toolServer) {
    toolServer.stop();
    toolServer = undefined;
  }
  
  if (webviewPanel) {
    webviewPanel.dispose();
    webviewPanel = undefined;
  }
  
  contextGlobal = undefined;
}
