# DeepSeek VSCode Extension Integration Guide

## Overview

The DeepSeek WebView2 integration can be embedded into a VSCode extension just like the former Qwen Code Assist extension. This guide shows you how.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              VSCode Extension                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Sidebar Chat View (WebView)                     │   │
│  │  • DeepSeek Chat UI                              │   │
│  │  • Tool call visualization                       │   │
│  │  • Settings panel                                │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          │ VSCode Webview API            │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Extension Host (Node.js)                        │   │
│  │  • DeepSeekChatVSCode class                      │   │
│  │  • Tool API Server (localhost:3456)              │   │
│  │  • Command handlers                              │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          │ HTTP                          │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Qwen Code Core Tools                            │   │
│  │  • read_file, write_file, edit, etc.             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Quick Start: Create a VSCode Extension

### Step 1: Initialize Extension

```bash
# Create extension folder
mkdir my-deepseek-extension
cd my-deepseek-extension

# Initialize npm project
npm init -y

# Install dependencies
npm install @qwen-code/webview2-deepseek @qwen-code/qwen-code-core
npm install --save-dev @types/vscode typescript
```

### Step 2: Create package.json

```json
{
  "name": "my-deepseek-extension",
  "displayName": "My DeepSeek Extension",
  "description": "DeepSeek Chat integration for VSCode",
  "version": "0.1.0",
  "publisher": "your-publisher-id",
  "engines": {
    "vscode": "^1.85.0"
  },
  "activationEvents": [
    "onStartupFinished",
    "onView:deepseek-chat.view"
  ],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "deepseek-sidebar",
          "title": "DeepSeek Chat",
          "icon": "$(comment)"
        }
      ]
    },
    "views": {
      "deepseek-sidebar": [
        {
          "type": "webview",
          "id": "deepseek-chat.view",
          "name": "DeepSeek Chat"
        }
      ]
    },
    "commands": [
      {
        "command": "deepseek-chat.open",
        "title": "Open DeepSeek Chat"
      },
      {
        "command": "deepseek-chat.newConversation",
        "title": "New Conversation"
      }
    ]
  },
  "main": "./dist/extension.js",
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "dependencies": {
    "@qwen-code/webview2-deepseek": "*"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Step 3: Create Extension Code

Create `src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { activateDeepSeekChat, DeepSeekChatVSCode } from '@qwen-code/webview2-deepseek/vscode';

let chatInstance: DeepSeekChatVSCode | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('DeepSeek Extension is now active!');

  try {
    // Activate DeepSeek Chat integration
    chatInstance = await activateDeepSeekChat(context, {
      port: 3456,
      workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    });

    console.log(`DeepSeek Chat server started on ${chatInstance.getServerInfo()?.url}`);

    // Register additional commands
    context.subscriptions.push(
      vscode.commands.registerCommand('deepseek-chat.acceptDiff', () => {
        // Handle diff acceptance
        vscode.window.showInformationMessage('Diff accepted!');
      })
    );

  } catch (error) {
    console.error('Failed to activate DeepSeek Chat:', error);
    vscode.window.showErrorMessage(
      `Failed to start DeepSeek Chat: ${(error as Error).message}`
    );
  }
}

export function deactivate() {
  if (chatInstance) {
    chatInstance.stop();
  }
}
```

### Step 4: Create tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 5: Run and Debug

1. Press `F5` to launch the Extension Development Host
2. The DeepSeek Chat sidebar should appear automatically
3. Enter your DeepSeek API key in the settings panel
4. Start chatting!

## Advanced Integration

### Custom Chat View Provider

If you want more control over the chat UI:

```typescript
import * as vscode from 'vscode';
import { DeepSeekChatIDE } from '@qwen-code/webview2-deepseek/ide';

export class CustomChatViewProvider implements vscode.WebviewViewProvider {
  private chatIDE: DeepSeekChatIDE;
  private view?: vscode.WebviewView;

  constructor(
    private extensionUri: vscode.Uri,
    private context: vscode.ExtensionContext
  ) {
    this.chatIDE = new DeepSeekChatIDE({ port: 3456 });
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    // Start server if not running
    const serverInfo = await this.chatIDE.start();

    // Load custom UI
    webviewView.webview.html = this.getWebviewContent(serverInfo);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'executeTool':
            this.handleToolExecution(message.data);
            break;
        }
      }
    );
  }

  private getWebviewContent(serverInfo: any) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>DeepSeek Chat</title>
  <style>
    body { 
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    iframe { width: 100%; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe src="${serverInfo.url}"></iframe>
</body>
</html>`;
  }

  private async handleToolExecution(data: any) {
    // Custom tool handling logic
  }
}
```

### Tool Execution from Extension

You can execute tools directly from your extension:

```typescript
import { ToolBridge } from '@qwen-code/webview2-deepseek';
import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

// Setup
const config = new Config({ targetDir: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath });
const toolRegistry = new ToolRegistry(config);
await toolRegistry.discoverAllTools();

const bridge = new ToolBridge(toolRegistry);

// Execute a tool
const result = await bridge.executeTool('read_file', {
  file_path: vscode.window.activeTextEditor?.document.uri.fsPath
});

vscode.window.showInformationMessage(`File content: ${result.content}`);
```

### Custom Commands with Tool Access

```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('deepseek-chat.explainFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file');
      return;
    }

    // Read the file
    const fileContent = await bridge.executeTool('read_file', {
      file_path: editor.document.uri.fsPath
    });

    // Send to DeepSeek for explanation
    const response = await client.chat([
      { 
        role: 'user', 
        content: `Explain this code:\n\n${fileContent.content}` 
      }
    ]);

    // Show in chat panel
    chatInstance?.openChat();
    // (Send response to webview)
  })
);
```

## Configuration

### Extension Settings

Add to `package.json`:

```json
"contributes": {
  "configuration": {
    "title": "DeepSeek Chat",
    "properties": {
      "deepseek.apiKey": {
        "type": "string",
        "default": "",
        "description": "DeepSeek API key"
      },
      "deepseek.baseUrl": {
        "type": "string",
        "default": "https://api.deepseek.com/v1",
        "description": "DeepSeek API base URL"
      },
      "deepseek.model": {
        "type": "string",
        "default": "deepseek-chat",
        "description": "Model to use"
      },
      "deepseek.port": {
        "type": "number",
        "default": 3456,
        "description": "Tool API server port"
      }
    }
  }
}
```

### Access Settings in Code

```typescript
const config = vscode.workspace.getConfiguration('deepseek');
const apiKey = config.get('apiKey') || process.env.DEEPSEEK_API_KEY;
const baseUrl = config.get('baseUrl');
const model = config.get('model');
```

## Distribution

### Package Extension

```bash
# Install vsce
npm install -g @vscode/vsce

# Package
vsce package

# This creates: my-deepseek-extension-0.1.0.vsix
```

### Publish to Marketplace

```bash
# Login to marketplace
vsce login your-publisher-id

# Publish
vsce publish
```

## Debugging Tips

1. **Check Output Panel**: View extension logs in VSCode Output panel
2. **Use Developer Tools**: Help → Toggle Developer Tools
3. **Check Server Status**: `curl http://localhost:3456/health`
4. **Lock File Location**: `~/.qwen/ide/deepseek-chat-3456.lock`

## Example: Full Extension Structure

```
my-deepseek-extension/
├── .vscode/
│   └── launch.json
├── src/
│   ├── extension.ts
│   ├── chatViewProvider.ts
│   └── toolHandler.ts
├── webview/
│   └── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## Migration from Qwen Code Assist

If you're migrating from the former Qwen Code Assist extension:

1. **Replace imports**:
   ```typescript
   // Old
   import { activateQwenCode } from '@qwen-code/qwen-code/vscode';
   
   // New
   import { activateDeepSeekChat } from '@qwen-code/webview2-deepseek/vscode';
   ```

2. **Update authentication**:
   ```typescript
   // Old: Qwen OAuth
   await activateQwenCode(context, { authType: 'qwen-oauth' });
   
   // New: API Key
   await activateDeepSeekChat(context, { 
     apiKey: config.get('apiKey') 
   });
   ```

3. **Update configuration schema** in `package.json`

## Support

- [DeepSeek WebView2 Package README](../packages/webview2-deepseek/README.md)
- [VSCode API Documentation](https://code.visualstudio.com/api)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

## License

Apache-2.0
