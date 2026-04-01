# DeepSeek WebView2 VSCode Extension

Embed the official DeepSeek chat (https://chat.deepseek.com) into VSCode with full Qwen Code tool integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VSCode Extension                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Webview Panel                                       │   │
│  │   ┌────────────────────────────────────────────────┐  │   │
│  │   │  https://chat.deepseek.com (iframe)            │  │   │
│  │   │  • DeepSeek Chat UI                            │  │   │
│  │   │  • Official DeepSeek interface                 │  │   │
│  │   └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ postMessage (tool calls)          │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Extension Host (Node.js)                            │   │
│  │   • Tool call interceptor                            │   │
│  │   • Qwen Code Tool Bridge                            │   │
│  │   • Tool API Server (localhost:3456)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ Tool Execution                    │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Qwen Code Core Tools                                │   │
│  │   • read_file, write_file, edit, glob, grep, shell   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

1. **User opens DeepSeek panel in VSCode** → Loads `https://chat.deepseek.com` in a webview
2. **User chats with DeepSeek** → Uses the official DeepSeek web interface
3. **DeepSeek wants to use tools** → Sends tool call requests via postMessage
4. **Extension intercepts tool calls** → Executes Qwen Code tools locally
5. **Tool results returned** → Sent back to DeepSeek via postMessage
6. **DeepSeek continues** → Uses tool results to provide better answers

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/QwenLM/qwen-code.git
cd qwen-code

# Install dependencies
npm install

# Build the extension
cd packages/vscode-ide-companion
npm install
npm run compile
```

### Running the Extension

1. Open `packages/vscode-ide-companion` in VSCode
2. Press `F5` to launch Extension Development Host
3. The DeepSeek panel will appear in the sidebar
4. Start chatting with DeepSeek!

## Features

- ✅ **Official DeepSeek UI** - Uses the real chat.deepseek.com interface
- ✅ **Full Tool Access** - All 20+ Qwen Code tools available
- ✅ **Sidebar Integration** - Chat panel in VSCode activity bar
- ✅ **Tool Visualization** - See tool calls and results in real-time
- ✅ **Secure** - Tools run locally, API keys stay in browser
- ✅ **No API Key Needed** - Use your existing DeepSeek account

## Available Tools

DeepSeek can use these Qwen Code tools:

| Tool | Description |
|------|-------------|
| `read_file` | Read file content |
| `write_file` | Write content to file |
| `edit` | Find-and-replace in file |
| `glob` | Find files by pattern |
| `grep` | Search file contents |
| `ls` | List directory contents |
| `shell` | Execute shell commands |
| `web_fetch` | Fetch web page content |
| `todo_write` | Manage task list |
| `ask_user_question` | Ask user for input |
| `memory` | Read/write persistent notes |

## Configuration

### Settings

Add to your VSCode `settings.json`:

```json
{
  "deepseek-webview.url": "https://chat.deepseek.com",
  "deepseek-webview.port": 3456,
  "deepseek-webview.workspace": "${workspaceFolder}",
  "deepseek-webview.autoStart": true
}
```

### Tool Permissions

Configure which tools DeepSeek can use:

```json
{
  "deepseek-webview.tools": {
    "read_file": "allow",
    "write_file": "ask",
    "edit": "ask",
    "shell": "ask",
    "glob": "allow",
    "grep": "allow"
  }
}
```

## Development

### Extension Structure

```
vscode-ide-companion/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── deepseekWebview.ts    # DeepSeek webview panel
│   ├── toolBridge.ts         # Tool execution bridge
│   └── toolInterceptor.ts    # Intercept DeepSeek tool calls
├── webview/
│   └── deepseek.html         # WebView HTML (iframe wrapper)
├── package.json              # Extension manifest
└── tsconfig.json
```

### Key Files

#### extension.ts

```typescript
import * as vscode from 'vscode';
import { DeepSeekWebviewPanel } from './deepseekWebview';
import { ToolBridge } from './toolBridge';

export async function activate(context: vscode.ExtensionContext) {
  // Create tool bridge
  const toolBridge = new ToolBridge({
    workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  });

  // Create DeepSeek webview panel
  const panel = new DeepSeekWebviewPanel(context.extensionUri, toolBridge);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('deepseek.open', () => panel.open())
  );

  // Register in sidebar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'deepseek-webview.sidebar',
      panel
    )
  );
}
```

#### deepseekWebview.ts

```typescript
import * as vscode from 'vscode';
import { ToolBridge } from './toolBridge';

export class DeepSeekWebviewPanel {
  private panel?: vscode.WebviewPanel;
  private toolBridge: ToolBridge;

  constructor(
    private extensionUri: vscode.Uri,
    toolBridge: ToolBridge
  ) {
    this.toolBridge = toolBridge;
  }

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
        retainContextWhenHidden: true
      }
    );

    this.panel.webview.html = this.getHtmlContent();

    // Handle tool call messages from webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'tool_call') {
        const result = await this.toolBridge.executeTool(
          message.toolName,
          message.params
        );
        this.panel?.webview.postMessage({
          type: 'tool_result',
          toolCallId: message.toolCallId,
          result
        });
      }
    });
  }

  private getHtmlContent() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>DeepSeek Chat</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe src="https://chat.deepseek.com"></iframe>
        <script>
          // Listen for tool calls from DeepSeek
          window.addEventListener('message', (event) => {
            if (event.data.type === 'tool_call') {
              // Forward to extension host
              vscode.postMessage(event.data);
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}
```

#### toolBridge.ts

```typescript
import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

export class ToolBridge {
  private toolRegistry: ToolRegistry;

  constructor(options: { workspace: string }) {
    const config = new Config({ targetDir: options.workspace });
    this.toolRegistry = new ToolRegistry(config);
  }

  async initialize() {
    await this.toolRegistry.discoverAllTools();
  }

  async executeTool(toolName: string, params: any) {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    const result = await tool.buildAndExecute(
      params,
      new AbortController().signal
    );

    return {
      success: true,
      content: result.llmContent,
      display: result.returnDisplay
    };
  }

  getToolsForDeepSeek() {
    const tools = this.toolRegistry.getFunctionDeclarations();
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.schema?.parametersJsonSchema
    }));
  }
}
```

## Usage Examples

### Example 1: Read a File

**User**: "Read the main.ts file and explain what it does"

**DeepSeek** → Tool Call:
```json
{
  "toolName": "read_file",
  "params": { "file_path": "src/main.ts" }
}
```

**Extension** → Executes tool → Returns content

**DeepSeek** → Provides explanation based on file content

### Example 2: Search Code

**User**: "Find all usages of the UserService class"

**DeepSeek** → Tool Call:
```json
{
  "toolName": "grep",
  "params": { 
    "pattern": "UserService",
    "path": "src/"
  }
}
```

**Extension** → Searches files → Returns results

**DeepSeek** → Lists all usages

### Example 3: Refactor Code

**User**: "Refactor this function to use async/await"

**DeepSeek** → Tool Call:
```json
{
  "toolName": "read_file",
  "params": { "file_path": "src/utils.ts" }
}
```

**Extension** → Reads file

**DeepSeek** → Generates refactored code → Tool Call:
```json
{
  "toolName": "edit",
  "params": {
    "file_path": "src/utils.ts",
    "old_string": "function fetchData() { ... }",
    "new_string": "async function fetchData() { ... }"
  }
}
```

**Extension** → Applies edit → Returns success

**DeepSeek** → Confirms the refactoring

## Troubleshooting

### DeepSeek page doesn't load

- Check your internet connection
- DeepSeek may have CORS restrictions for iframes
- Try using the Tool API server approach instead

### Tools not working

- Ensure the extension is activated
- Check the Output panel for errors
- Verify workspace folder is set correctly

### Tool permissions

- Some tools require explicit permission
- You'll be prompted to allow/deny each tool call
- Configure default permissions in settings

## Alternative: Tool API Server

If iframe embedding doesn't work due to CORS, use the Tool API server approach:

1. **Start Tool API server**:
   ```bash
   npm run start:webview2
   ```

2. **Use a userscript** (Tampermonkey/Greasemonkey) on chat.deepseek.com that:
   - Intercepts tool calls
   - Calls the local Tool API server
   - Returns results to DeepSeek

See `packages/webview2-deepseek/TOOL_API_GUIDE.md` for details.

## Security Considerations

- **API Keys**: DeepSeek credentials stay in the browser, not shared with extension
- **Tool Permissions**: Review each tool call before execution
- **Workspace Access**: Tools only access the opened workspace
- **Network**: Tool API server runs on localhost only

## License

Apache-2.0

## Related

- [DeepSeek](https://chat.deepseek.com) - Official DeepSeek chat
- [Qwen Code Tools](../packages/core/src/tools/) - Available tools
- [VSCode Webview API](https://code.visualstudio.com/api/extension-guides/webview)
