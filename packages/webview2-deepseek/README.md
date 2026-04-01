# @qwen-code/webview2-deepseek

DeepSeek WebView2 Chat integration for Qwen Code - A desktop AI assistant with full filesystem tool access.

## Features

- 🚀 **DeepSeek Integration** - Connect to DeepSeek API for advanced AI chat
- 🔧 **Full Tool Access** - All 20+ Qwen Code tools available (read_file, write_file, edit, grep, shell, etc.)
- 🌐 **WebView2 UI** - Modern chat interface with tool call visualization
- 🏗️ **.NET Host** - WPF/WinForms WebView2 host application (Windows only)
- 🔐 **Permission System** - Built-in permission prompts for sensitive operations
- 📡 **HTTP API** - RESTful API for tool execution from any client
- 💻 **IDE Integration** - VSCode extension support with sidebar chat

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build the TypeScript package
npm run build
```

### Running

```bash
# Start browser UI
npm run start:ui

# Start API server only
npm run start:server

# Start IDE mode
npm run start:ide

# Interactive CLI
npm run start
```

### Using npx

```bash
# Run directly without installation
npx qwen-deepseek ui
npx qwen-deepseek server --port 8080
npx qwen-deepseek chat
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              WebView2 Host Application                       │
│  (WPF/WinForms with Microsoft.Web.WebView2)                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   DeepSeek Chat UI (HTML/CSS/JavaScript)             │   │
│  │   • Chat interface                                   │   │
│  │   • Tool call visualization                          │   │
│  │   • Settings panel                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ WebView2 IPC                      │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   C# Host Object                                      │   │
│  │   • Tool execution handler                           │   │
│  │   • Permission dialog                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ HTTP (localhost)                  │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Tool API Server (Node.js)                           │   │
│  │   • Express REST API                                 │   │
│  │   • ToolRegistry bridge                              │   │
│  │   • Qwen Code Core integration                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Tool API Endpoints

When running the server (`npm run start:server`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/tools` | GET | Get all tools (DeepSeek format) |
| `/api/tools/list` | GET | List tools with descriptions |
| `/api/tools/execute` | POST | Execute a single tool |
| `/api/tools/execute-batch` | POST | Execute multiple tools |
| `/api/tools/permission` | POST | Check tool permission |

### Example: Execute a Tool

```bash
curl -X POST http://localhost:3456/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "read_file",
    "params": {
      "file_path": "C:/project/main.ts"
    }
  }'
```

## Available Tools

All 20+ Qwen Code tools are available:

| Tool | Description | Permission |
|------|-------------|------------|
| `read_file` | Read file content | allow (workspace) |
| `write_file` | Write content to file | ask |
| `edit` | Find-and-replace in file | ask |
| `glob` | Find files by pattern | allow |
| `grep` | Search file contents | allow |
| `ls` | List directory contents | allow |
| `shell` | Execute shell command | ask |
| `web_fetch` | Fetch web page content | ask |
| `todo_write` | Manage task list | allow |
| `ask_user_question` | Ask user for input | ask |
| `memory` | Read/write persistent notes | allow |
| `glob_to_list_files` | Find and read multiple files | allow |

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key |
| `QWEN_DEEPSEEK_PORT` | Default port (overrides --port) |
| `QWEN_DEEPSEEK_WORKSPACE` | Default workspace |

### Settings File

Create `~/.qwen/settings.json`:

```json
{
  "deepSeek": {
    "apiKey": "sk-your-api-key",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat"
  }
}
```

## Programmatic Usage

### TypeScript/JavaScript

```typescript
import { ToolBridge, DeepSeekClient } from '@qwen-code/webview2-deepseek';
import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

// Setup
const config = new Config({ targetDir: '/path/to/workspace' });
const toolRegistry = new ToolRegistry(config);
await toolRegistry.discoverAllTools();

// Create tool bridge
const bridge = new ToolBridge(toolRegistry);

// Get tools for DeepSeek
const tools = bridge.getToolsForDeepSeek();

// Execute a tool
const result = await bridge.executeTool('read_file', {
  file_path: '/path/to/file.txt'
});

console.log(result.content);
```

### DeepSeek Client

```typescript
const client = new DeepSeekClient({
  apiKey: 'sk-your-api-key',
  model: 'deepseek-chat'
});

client.setToolRegistry(toolRegistry);

// Chat with tool calling
const response = await client.chat([
  { role: 'user', content: 'Read the main.ts file and explain what it does' }
]);

console.log(response.content);
```

### IDE Integration

#### VSCode Extension

```typescript
import { activateDeepSeekChat } from '@qwen-code/webview2-deepseek/vscode';

export async function activate(context: vscode.ExtensionContext) {
  const deepseek = await activateDeepSeekChat(context);
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('myext.openChat', () => {
      deepseek.openChat();
    })
  );
}
```

#### Auto-Discovery

```typescript
import { getExistingServer, autoStart } from '@qwen-code/webview2-deepseek/ide';

// Check if server is already running
const server = getExistingServer();
if (server) {
  console.log(`DeepSeek Chat running on ${server.url}`);
} else {
  // Start new instance
  const info = await autoStart({ port: 3456 });
  console.log(`Started on ${info.url}`);
}
```

## Building

### Build TypeScript Package

```bash
npm run build
```

### Build .NET Host Application (Windows)

```bash
cd host-app
dotnet build --configuration Release
```

### Development Mode

```bash
# Watch mode for TypeScript
npm run dev

# Clean build artifacts
npm run clean
```

## Troubleshooting

### Tool API Server won't start

1. Ensure Node.js 20+ is installed
2. Check if port 3456 is available
3. Verify `@qwen-code/qwen-code-core` is installed

### WebView2 not loading

1. Install WebView2 runtime: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. Check .NET 8 SDK is installed
3. Verify `appsettings.json` exists

### DeepSeek API errors

1. Verify API key is correct
2. Check network connectivity
3. Ensure API key has sufficient quota

### Permission denied for tools

Some tools require explicit permission. When prompted, approve the tool execution.

## License

Apache-2.0

## Related Packages

- `@qwen-code/qwen-code-core` - Core Qwen Code functionality
- `@qwen-code/qwen-code` - Main CLI package
- `@qwen-code/webui` - Shared web UI components
