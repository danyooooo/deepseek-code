# DeepSeek Integration Guide

## Overview

This codebase has been enhanced with **DeepSeek WebView2 integration**, allowing you to use the official DeepSeek chat (https://chat.deepseek.com) with full access to Qwen Code's 20+ filesystem tools.

## What's New in Version 0.15.0

### Three Ways to Use DeepSeek

1. **VSCode Extension** (Recommended for Development)
   - Embed chat.deepseek.com directly in VSCode
   - Sidebar panel with tool integration
   - Full documentation: [packages/vscode-deepseek-webview/README.md](./packages/vscode-deepseek-webview/README.md)

2. **WebView2 Desktop App** (Windows)
   - Native Windows application
   - Modern chat interface
   - Full documentation: [packages/webview2-deepseek/README.md](./packages/webview2-deepseek/README.md)

3. **CLI with DeepSeek API**
   - Traditional terminal interface
   - Use DeepSeek API directly
   - Full documentation: [README.md](./README.md)

## Architecture

### VSCode Extension Architecture

```
┌─────────────────────────────────────────────────┐
│              VSCode Extension                    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Sidebar Webview                         │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  https://chat.deepseek.com         │  │   │
│  │  │  (Official DeepSeek UI in iframe)  │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    │ postMessage                 │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  Extension Host (Node.js)                │   │
│  │  • ToolBridge                            │   │
│  │  • Tool API Server (localhost:3456)      │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  Qwen Code Core Tools                    │   │
│  │  read_file, write_file, edit, grep...    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Tool Call Flow

1. **User**: "Read the main.ts file"
2. **DeepSeek** (in iframe): Generates tool_call request
3. **Extension**: Intercepts via postMessage
4. **ToolBridge**: Executes Qwen Code tool (`read_file`)
5. **Result**: File content returns to DeepSeek
6. **DeepSeek**: Continues conversation with tool result

## Quick Start (5 Minutes)

### Step 1: Navigate to Extension

```bash
cd packages/vscode-deepseek-webview
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build Extension

```bash
npm run compile
```

### Step 4: Open in VSCode

```bash
code .
```

### Step 5: Launch Extension Host

1. Press `F5` in VSCode
2. New VSCode window opens ("Extension Development Host")
3. Click **DeepSeek Chat** icon in activity bar
4. Log in to DeepSeek (if needed)
5. Start chatting!

## Available Tools

All 20+ Qwen Code tools are available to DeepSeek:

| Tool | Description | Default Permission |
|------|-------------|-------------------|
| `read_file` | Read file content | allow |
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

## Configuration

### VSCode Settings

Add to `settings.json`:

```json
{
  "deepseek-webview.url": "https://chat.deepseek.com",
  "deepseek-webview.toolServerPort": 3456,
  "deepseek-webview.autoStartServer": true,
  "deepseek-webview.workspace": "${workspaceFolder}",
  "deepseek-webview.toolPermissions": {
    "read_file": "allow",
    "write_file": "ask",
    "edit": "ask",
    "shell": "ask",
    "glob": "allow",
    "grep": "allow"
  }
}
```

### Tool Permissions

| Permission | Description |
|------------|-------------|
| `allow` | Tool executes automatically |
| `ask` | Show confirmation dialog |
| `deny` | Block tool execution |

## Example Usage

### Example 1: Read a File

**You**: "Read the main.ts file and explain what it does"

**Flow**:
```
DeepSeek → tool_call: read_file({ file_path: "main.ts" })
Extension → Executes tool
Result → File content
DeepSeek → Provides explanation
```

### Example 2: Search Code

**You**: "Find all usages of the UserService class"

**Flow**:
```
DeepSeek → tool_call: grep({ pattern: "UserService", path: "src/" })
Extension → Searches files
Result → Match results
DeepSeek → Lists all usages
```

### Example 3: Refactor Code

**You**: "Refactor this function to use async/await"

**Flow**:
```
DeepSeek → tool_call: read_file({ file_path: "src/utils.ts" })
Extension → Reads file
DeepSeek → Generates changes
DeepSeek → tool_call: edit({ file_path, old_string, new_string })
Extension → Applies edit
DeepSeek → Confirms success
```

## Package Structure

```
qwen-code/
├── packages/
│   ├── vscode-deepseek-webview/     ⭐ VSCode extension
│   │   ├── src/
│   │   │   ├── extension.ts          # Main entry point
│   │   │   ├── deepseekWebviewPanel.ts
│   │   │   ├── toolBridge.ts
│   │   │   └── toolApiServer.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── webview2-deepseek/           ⭐ WebView2 integration
│   │   ├── src/
│   │   │   ├── DeepSeekClient.ts
│   │   │   ├── ToolBridge.ts
│   │   │   └── ToolApiServer.ts
│   │   ├── webview/
│   │   │   └── index.html
│   │   ├── host-app/                 # .NET Windows app
│   │   └── README.md
│   │
│   ├── core/                         # Qwen Code tools
│   ├── cli/                          # Traditional CLI
│   └── ...
│
└── README.md                         # Main documentation
```

## Development

### Build Commands

```bash
# Build all packages
npm run build

# Build WebView2 package
npm run build:webview2

# Build VSCode extension
cd packages/vscode-deepseek-webview
npm run compile
```

### Testing

```bash
# Run all tests
npm run test

# Run WebView2 tests
npm run test:webview2

# Full preflight check
npm run preflight
```

### Debugging

**VSCode Extension:**
1. Open `packages/vscode-deepseek-webview` in VSCode
2. Press `F5` to launch Extension Development Host
3. Check Output panel for logs

**Tool API Server:**
```bash
curl http://localhost:3456/health
curl http://localhost:3456/api/tools
```

## Troubleshooting

### DeepSeek page doesn't load

**Solutions:**
1. Check internet connection
2. Try panel mode: `Ctrl+Shift+P` → "DeepSeek: Open"
3. Some browsers block iframes - try different browser

### Tools not working

**Solutions:**
1. Check tool server: `curl http://localhost:3456/health`
2. Start server manually: `DeepSeek: Start Tool API Server`
3. Check workspace folder is open
4. Check Output panel for errors

### Extension doesn't appear

**Solutions:**
1. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Press F5 to launch Extension Development Host
3. Check activation: `Ctrl+Shift+P` → "Developer: Show Running Extensions"

## API Reference

### Tool API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/tools` | GET | Get all tools |
| `/api/tools/execute` | POST | Execute a tool |
| `/api/tools/execute-batch` | POST | Execute multiple tools |

### Example: Execute Tool

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

## Security

- **Local Execution**: All tools run on your machine
- **Permission System**: Control which tools DeepSeek can use
- **Sandbox Webview**: Iframe isolation for security
- **No API Key Required**: Uses browser session

## Credits & Acknowledgments

This integration builds upon:

- **[Qwen Code](https://github.com/QwenLM/qwen-code)** - Core tool infrastructure
- **[Google Gemini CLI](https://github.com/google-gemini/gemini-cli)** - Original inspiration
- **[DeepSeek](https://deepseek.com/)** - AI model provider

## Documentation Index

| Document | Location |
|----------|----------|
| **VSCode Extension README** | [packages/vscode-deepseek-webview/README.md](./packages/vscode-deepseek-webview/README.md) |
| **Quick Start Guide** | [packages/vscode-deepseek-webview/QUICKSTART.md](./packages/vscode-deepseek-webview/QUICKSTART.md) |
| **Implementation Summary** | [packages/vscode-deepseek-webview/IMPLEMENTATION_SUMMARY.md](./packages/vscode-deepseek-webview/IMPLEMENTATION_SUMMARY.md) |
| **WebView2 Package README** | [packages/webview2-deepseek/README.md](./packages/webview2-deepseek/README.md) |
| **VSCode Extension Tutorial** | [packages/webview2-deepseek/VSCODE_EXTENSION_GUIDE.md](./packages/webview2-deepseek/VSCODE_EXTENSION_GUIDE.md) |
| **Architecture Comparison** | [packages/webview2-deepseek/CLARIFICATION.md](./packages/webview2-deepseek/CLARIFICATION.md) |
| **Main README** | [README.md](./README.md) |
| **Migration Guide** | [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) |

## Support

- **GitHub Issues**: https://github.com/QwenLM/qwen-code/issues
- **Discord**: https://discord.gg/RN7tqZCeDK
- **Documentation**: https://qwenlm.github.io/qwen-code-docs/

---

**Happy Coding with DeepSeek! 🚀**
