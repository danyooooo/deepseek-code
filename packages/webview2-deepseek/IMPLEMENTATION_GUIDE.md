# WebView2 DeepSeek Integration - Implementation Guide

## Overview

This package provides a complete WebView2-based DeepSeek chat application with full access to Qwen Code's filesystem tools.

## What Was Built

### 1. TypeScript/Node.js Package (`packages/webview2-deepseek/`)

#### Core Components

| File | Purpose |
|------|---------|
| `src/types.ts` | Type definitions for OpenAI/DeepSeek tool format conversion |
| `src/DeepSeekClient.ts` | DeepSeek API client with automatic tool calling |
| `src/ToolBridge.ts` | Bridge between DeepSeek and Qwen Code tools |
| `src/ToolApiServer.ts` | Express-based HTTP API server |
| `src/index.ts` | Public exports |
| `tool-api-server.js` | Standalone server script |

#### Key Features

- **Tool Conversion**: Automatically converts Qwen's `FunctionDeclaration` to OpenAI/DeepSeek format
- **Automatic Tool Execution**: DeepSeekClient handles the full chat → tool_call → result loop
- **Permission System**: Integrates with Qwen's built-in permission system
- **Batch Execution**: Execute multiple tools in parallel

### 2. WebView2 HTML/JS Interface (`webview/index.html`)

A complete, modern chat UI with:

- **Message Types**: User, Assistant, Thinking, Tool Call, Error
- **Tool Visualization**: Shows tool name, parameters, status, and results
- **Settings Panel**: Configure API key, base URL, model
- **Local Storage**: Persists settings across sessions
- **Auto-scroll**: Smooth scrolling to latest messages
- **Markdown Support**: Basic markdown rendering
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for newline

### 3. .NET/C# Host Application (`host-app/`)

A complete Windows desktop application:

| File | Purpose |
|------|---------|
| `MainForm.cs` | Main WebView2 host form |
| `ToolApiServer.cs` | .NET wrapper for Node.js server |
| `Program.cs` | Application entry point |
| `appsettings.json` | Configuration file |
| `QwenCode.WebView2.csproj` | Project file |

Features:
- **WebView2 Integration**: Full Chromium-based browser in Windows Forms
- **IPC Communication**: JavaScript ↔ C# message passing
- **Permission Dialogs**: Native Windows dialogs for tool permissions
- **Auto-start**: Tool API server starts automatically
- **Graceful Shutdown**: Clean process termination

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User types: "Read the main.ts file"                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  WebView2 Chat UI (JavaScript)                              │
│  • Adds message to history                                  │
│  • Calls DeepSeek API with tools                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  DeepSeek API                                               │
│  • Processes message                                        │
│  • Returns tool_call: { name: "read_file", args: {...} }   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  WebView2 Chat UI (JavaScript)                              │
│  • Displays tool call UI                                    │
│  • POST /api/tools/execute                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Tool API Server (Node.js/Express)                          │
│  • Receives request                                         │
│  • Calls ToolBridge.executeTool()                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ToolBridge (TypeScript)                                    │
│  • Gets tool from ToolRegistry                              │
│  • Calls tool.buildAndExecute()                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Qwen Code Core - ReadFileTool                              │
│  • Validates parameters                                     │
│  • Checks permissions                                       │
│  • Calls FileSystemService                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  FileSystemService (Node.js fs/promises)                    │
│  • fs.readFile('./main.ts')                                 │
│  • Handles encoding, BOM, line endings                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Windows Filesystem                                         │
│  C:/project/main.ts                                         │
└─────────────────────────────────────────────────────────────┘
```

## How to Use

### Option 1: Standalone Web UI

1. Start the Tool API server:
   ```bash
   node tool-api-server.js --port 3456
   ```

2. Open `webview/index.html` in a browser

3. Enter your DeepSeek API key in Settings

4. Start chatting!

### Option 2: .NET Desktop Application

1. Build the host app:
   ```bash
   cd host-app
   dotnet build
   ```

2. Run:
   ```bash
   dotnet run
   ```

3. The app automatically:
   - Starts the Tool API server
   - Loads the WebView2 UI
   - Connects everything together

### Option 3: Programmatic Usage

```typescript
import { DeepSeekClient, ToolBridge } from '@qwen-code/webview2-deepseek';
import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

// Setup
const config = new Config({ targetDir: '/my/project' });
const toolRegistry = new ToolRegistry(config);
await toolRegistry.discoverAllTools();

const bridge = new ToolBridge(toolRegistry);
const client = new DeepSeekClient({ apiKey: 'sk-...' });
client.setToolRegistry(toolRegistry);

// Chat with tools
const response = await client.chat([
  { role: 'user', content: 'Refactor the main function to use async/await' }
]);

console.log(response.content);
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/tools` | GET | Get all tools (DeepSeek format) |
| `/api/tools/list` | GET | List tools with descriptions |
| `/api/tools/execute` | POST | Execute a single tool |
| `/api/tools/execute-batch` | POST | Execute multiple tools |
| `/api/tools/permission` | POST | Check tool permission |
| `/api/tools/allow` | POST | Allow tool for session |
| `/api/tools/deny` | POST | Deny tool for session |

## Tool Schema Conversion

The key to making this work is converting Google's `FunctionDeclaration` format to OpenAI/DeepSeek format:

```typescript
// Google format (from Qwen Code)
{
  name: 'read_file',
  description: 'Reads file content...',
  parametersJsonSchema: {
    type: 'object',
    properties: { file_path: { type: 'string', ... } },
    required: ['file_path']
  }
}

// OpenAI/DeepSeek format (converted)
{
  type: 'function',
  function: {
    name: 'read_file',
    description: 'Reads file content...',
    parameters: {
      type: 'object',
      properties: { file_path: { type: 'string', ... } },
      required: ['file_path']
    }
  }
}
```

The conversion is handled by `convertGoogleToolToOpenAI()` in `src/types.ts`.

## Next Steps

### To Deploy

1. **Publish npm package:**
   ```bash
   cd packages/webview2-deepseek
   npm version patch
   npm publish
   ```

2. **Build .NET app for distribution:**
   ```bash
   cd host-app
   dotnet publish -c Release -r win-x64 --self-contained
   ```

### To Extend

1. **Add more tools**: They're automatically discovered via `ToolRegistry.discoverAllTools()`

2. **Custom UI themes**: Modify `webview/index.html` CSS

3. **Additional APIs**: Add endpoints to `ToolApiServer.ts`

4. **Plugin system**: Use MCP protocol for external tools

## Files Created

```
packages/webview2-deepseek/
├── package.json
├── tsconfig.json
├── README.md
├── tool-api-server.js
├── test-api.js
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── DeepSeekClient.ts
│   ├── ToolBridge.ts
│   └── ToolApiServer.ts
├── webview/
│   └── index.html
├── host-app/
│   ├── QwenCode.WebView2.csproj
│   ├── appsettings.json
│   ├── MainForm.cs
│   ├── ToolApiServer.cs
│   └── Program.cs
└── examples/
    └── basic-usage.js
```

## Summary

You now have a **complete, working WebView2 DeepSeek chat application** that:

✅ Exposes all 20+ Qwen Code tools to DeepSeek  
✅ Provides a modern chat UI with tool visualization  
✅ Includes a .NET desktop host application  
✅ Has a REST API for tool execution  
✅ Integrates permission system  
✅ Supports both streaming and batch tool execution  
✅ Works standalone or embedded in Windows apps  

The implementation reuses Qwen Code's existing tool infrastructure - no changes to the core were needed!
