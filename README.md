<div align="center">

[![npm version](https://img.shields.io/npm/v/@qwen-code/qwen-code.svg)](https://www.npmjs.com/package/@qwen-code/qwen-code)
[![License](https://img.shields.io/github/license/QwenLM/qwen-code.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/@qwen-code/qwen-code.svg)](https://www.npmjs.com/package/@qwen-code/qwen-code)

<a href="https://trendshift.io/repositories/15287" target="_blank"><img src="https://trendshift.io/api/badge/repositories/15287" alt="QwenLM%2Fqwen-code | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

**An open-source AI agent framework with DeepSeek integration and full filesystem access via WebView2.**

<a href="https://qwenlm.github.io/qwen-code-docs/zh/users/overview">中文</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/de/users/overview">Deutsch</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/fr/users/overview">français</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ja/users/overview">日本語</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ru/users/overview">Русский</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/pt-BR/users/overview">Português (Brasil)</a>

</div>

> 🎉 **DeepSeek WebView2 Integration**: Embed https://chat.deepseek.com in VSCode with 20+ filesystem tools (read, write, edit, grep, shell, etc.)

Qwen Code is an open-source AI agent framework for the terminal and desktop. This version adds **DeepSeek WebView2 integration** while preserving all original Qwen Code tool infrastructure. It helps you understand large codebases, automate tedious work, and ship faster.

![](https://gw.alicdn.com/imgextra/i1/O1CN01D2DviS1wwtEtMwIzJ_!!6000000006373-2-tps-1600-900.png)

---

## 🌟 New: DeepSeek WebView2 Integration

This codebase has been enhanced with **DeepSeek WebView2** support:

- 🚀 **Official DeepSeek Chat** - Embed https://chat.deepseek.com directly in VSCode
- 🔧 **Full Tool Access** - All 20+ Qwen Code tools available to DeepSeek
- 📑 **VSCode Extension** - Sidebar panel with tool bridging
- 🖥️ **Desktop App** - WebView2-based Windows application
- 🏠 **Local Execution** - Tools run on your machine, securely

**Quick Start:**
```bash
# VSCode Extension
cd packages/vscode-deepseek-webview
npm install && npm run compile
# Press F5 in VSCode

# Or use the CLI
npx qwen-deepseek ui
```

📖 **Full Guide**: [packages/vscode-deepseek-webview/README.md](./packages/vscode-deepseek-webview/README.md)

---

## Why Qwen Code?

- **Flexible AI Support**: Works with DeepSeek, OpenAI, Anthropic, Gemini, and more
- **Full Tool Access**: 20+ built-in tools for filesystem operations, shell commands, web fetching, and more
- **Multiple UIs**: Terminal CLI, WebView2 desktop app, VSCode extension, or web interface
- **Open-Source & Extensible**: Build on top of the framework with MCP protocol support
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Start

### Option 1: VSCode Extension (Recommended for Development)

**New!** Use the official DeepSeek chat embedded in VSCode with full tool access:

```bash
# Build and run the extension
cd packages/vscode-deepseek-webview
npm install
npm run compile

# Press F5 to launch Extension Development Host
```

This gives you:
- 🚀 **Official DeepSeek UI** - Uses chat.deepseek.com directly
- 🔧 **Full Tool Access** - read_file, write_file, edit, grep, shell, etc.
- 📑 **Sidebar Integration** - Chat panel in VSCode activity bar
- 🔐 **Permission Control** - Approve/deny tool executions

**Full Documentation**: [packages/vscode-deepseek-webview/README.md](./packages/vscode-deepseek-webview/README.md)

---

### Option 2: Terminal CLI (Classic)

```bash
# Install globally
npm install -g @qwen-code/qwen-code

# Start interactive chat
qwen

# Or run a single command
qwen -p "Explain the structure of this project"
```

---

### Option 3: WebView2 Desktop App (Windows)

```bash
# Clone and run
git clone https://github.com/QwenLM/qwen-code.git
cd qwen-code
npm install

# Start the WebView2 UI
npm run start:ui

# Or start the Tool API server only
npm run start:webview2
```

---

### Option 4: DeepSeek CLI

```bash
# Interactive chat with DeepSeek
npx qwen-deepseek chat

# Browser-based UI
npx qwen-deepseek ui

# API server only
npx qwen-deepseek server --port 3456
```

---

## Authentication

### DeepSeek (WebView2)

**No API key needed!** The WebView2 extension uses your browser session at https://chat.deepseek.com.

### API Key (Alternative)

For CLI and programmatic use:

1. Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Set it via environment variable or settings file

#### Method 1: Environment Variable

```bash
export DEEPSEEK_API_KEY="sk-your-api-key"
qwen
```

#### Method 2: Settings File

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

---

## Usage Modes

### 1. VSCode Extension (DeepSeek WebView2)

The DeepSeek WebView2 extension provides:

- **Sidebar Chat** - DeepSeek in VSCode activity bar
- **Panel Mode** - Full editor panel view
- **Tool Integration** - All Qwen Code tools available
- **Permission System** - Control tool access

**Commands:**
- `DeepSeek: Open` - Open in editor panel
- `DeepSeek: Focus` - Focus the panel
- `DeepSeek: New Conversation` - Start fresh
- `DeepSeek: Start Tool API Server` - Manual server start

📖 **Guide**: [packages/vscode-deepseek-webview/QUICKSTART.md](./packages/vscode-deepseek-webview/QUICKSTART.md)

---

### 2. Terminal CLI

```bash
cd your-project/
qwen

# Then in the session:
/help
/model
/stats
```

**Example prompts:**
```
What does this project do?
Explain the codebase structure.
Help me refactor this function.
Generate unit tests for this module.
```

---

### 3. WebView2 Desktop App

The WebView2 app provides a modern desktop experience:

- **Native Windows UI** with dark theme
- **Tool call visualization** with real-time status
- **Settings panel** for API configuration
- **Permission prompts** for sensitive operations
- **Full filesystem access** via Qwen Code tools

**To run:**
```bash
npm run start:ui
```

Or build the .NET host app:
```bash
cd packages/webview2-deepseek/host-app
dotnet build
dotnet run
```

---

### 4. Headless/Script Mode

```bash
# Single command execution
qwen -p "Find all TypeScript files and count lines of code"

# In scripts
#!/bin/bash
qwen -p "Generate a summary of changes in git diff"
```

---

### 5. IDE Integration

#### VS Code (Custom UI)

```javascript
// In your extension
import { activateDeepSeekChat } from '@qwen-code/webview2-deepseek/vscode';

export async function activate(context) {
  const deepseek = await activateDeepSeekChat(context);
  deepseek.openChat();
}
```

**Full Guide**: See [VSCODE_EXTENSION_GUIDE.md](./packages/webview2-deepseek/VSCODE_EXTENSION_GUIDE.md) for complete VSCode extension development instructions.

#### Programmatic Usage

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
```

---

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
| `glob_to_list_files` | Find and read multiple files | allow |

---

## Configuration

### Settings File Location

| File | Scope |
|------|-------|
| `~/.qwen/settings.json` | User (global) |
| `.qwen/settings.json` | Project |

### Example Configuration

```json
{
  "deepSeek": {
    "apiKey": "sk-your-api-key",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat"
  },
  "workspace": {
    "targetDir": "/path/to/project",
    "excludePatterns": ["node_modules", ".git", "dist"]
  },
  "tools": {
    "shell": {
      "enabled": true,
      "requirePermission": true
    }
  }
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key |
| `DEEPSEEK_BASE_URL` | API base URL (default: https://api.deepseek.com/v1) |
| `DEEPSEEK_MODEL` | Model name (default: deepseek-chat) |
| `QWEN_WORKSPACE` | Default workspace directory |

---

## Commands & Shortcuts

### VSCode Extension Commands

- `DeepSeek: Open` - Open chat in editor panel
- `DeepSeek: Focus` - Focus the chat panel
- `DeepSeek: New Conversation` - Start a new conversation
- `DeepSeek: Start Tool API Server` - Start the tool server

### CLI Session Commands

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/stats` - Show session information
- `/model` - Switch model
- `/exit` or `/quit` - Exit

### Keyboard Shortcuts

- `Ctrl+C` - Cancel current operation
- `Ctrl+D` - Exit (on empty line)
- `Up/Down` - Navigate command history

---

## Architecture

### DeepSeek WebView2 Extension

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

### Traditional CLI

```
┌─────────────────────────────────────────────────┐
│                    Terminal                      │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Qwen Code CLI                           │   │
│  │  • Interactive chat                      │   │
│  │  • Command parsing                       │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  Qwen Code Core                          │   │
│  │  • ToolRegistry                          │   │
│  │  • FileSystemService                     │   │
│  │  • Permission System                     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Building from Source

### Prerequisites

- Node.js 20+
- npm 9+
- (Optional) .NET 8 SDK for WebView2 host app

### Setup

```bash
# Clone
git clone https://github.com/QwenLM/qwen-code.git
cd qwen-code

# Install dependencies
npm install

# Build all packages
npm run build

# Build WebView2 package
npm run build:webview2

# Build VSCode extension
cd packages/vscode-deepseek-webview
npm install && npm run compile
```

### Development

```bash
# Development mode with hot reload
npm run dev

# Run tests
npm run test

# Run WebView2 tests
npm run test:webview2

# Full preflight check
npm run preflight
```

---

## API Reference

### Tool API Endpoints

When running the Tool API server (`npm run start:webview2`):

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

---

## Troubleshooting

### VSCode Extension Issues

**DeepSeek page doesn't load:**
- Check your internet connection
- DeepSeek may have CORS restrictions for iframes
- Try opening in panel mode instead of sidebar

**Tools not working:**
- Check if tool server is running: `DeepSeek: Start Tool API Server`
- Ensure workspace folder is open
- Check Output panel for errors

### CLI Issues

**Tool API Server won't start:**
1. Ensure Node.js 20+ is installed
2. Check if port 3456 is available
3. Verify `@qwen-code/qwen-code-core` is installed

**WebView2 not loading:**
1. Install WebView2 runtime: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. Check .NET 8 SDK is installed
3. Verify `appsettings.json` exists

**DeepSeek API errors:**
1. Verify API key is correct
2. Check network connectivity
3. Ensure API key has sufficient quota

**Permission denied for tools:**
Some tools require explicit permission. When prompted, approve the tool execution.

---

## Benchmark Results

### Terminal-Bench Performance

| Model | Accuracy |
|-------|----------|
| deepseek-chat | 42.1% |
| deepseek-coder | 38.7% |
| qwen3-coder-plus | 37.5% |

---

## Ecosystem

- **VSCode DeepSeek WebView2** - Embed chat.deepseek.com in VSCode
- **WebView2 Desktop App** - Native Windows application
- **VS Code Extension** - Traditional IDE integration
- **MCP Protocol** - External tool support
- **TypeScript SDK** - Build custom integrations
- **Telegram/WeChat/DingTalk Channels** - Chat platform integrations

---

## Connect with Us

- **Discord**: https://discord.gg/RN7tqZCeDK
- **Dingtalk**: https://qr.dingtalk.com/action/joingroup?code=v1,k1,+FX6Gf/ZDlTahTIRi8AEQhIaBlqykA0j+eBKKdhLeAE=&_dt_no_comment=1&origin=1

---

## Acknowledgments & Credits

This project builds upon and integrates several excellent open-source projects:

### Primary Foundations

- **[Qwen Code](https://github.com/QwenLM/qwen-code)** (Original) - The core tool infrastructure, filesystem tools, permission system, and CLI framework. This enhanced version preserves all original Qwen Code functionality while adding DeepSeek WebView2 integration.

- **[Google Gemini CLI](https://github.com/google-gemini/gemini-cli)** - The original inspiration and architectural foundation for Qwen Code. We acknowledge and appreciate the excellent work of the Gemini CLI team.

### AI Providers

- **[DeepSeek](https://deepseek.com/)** - Advanced AI models (deepseek-chat, deepseek-coder) used in the WebView2 integration. Their OpenAI-compatible API makes integration seamless.

### Technology Stack

- **[Node.js](https://nodejs.org/)** - Runtime environment
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Express](https://expressjs.com/)** - Tool API server
- **[WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)** - Windows desktop app
- **[VSCode Extension API](https://code.visualstudio.com/api)** - IDE integration

### Community

We thank all contributors and users who have helped build and improve this project.

---

## License

**Apache-2.0** - See [LICENSE](./LICENSE) for details.

---

## Documentation Index

| Document | Location |
|----------|----------|
| **VSCode Extension Guide** | [packages/vscode-deepseek-webview/README.md](./packages/vscode-deepseek-webview/README.md) |
| **Quick Start (5 min)** | [packages/vscode-deepseek-webview/QUICKSTART.md](./packages/vscode-deepseek-webview/QUICKSTART.md) |
| **WebView2 Implementation** | [packages/webview2-deepseek/README.md](./packages/webview2-deepseek/README.md) |
| **VSCode Extension Tutorial** | [packages/webview2-deepseek/VSCODE_EXTENSION_GUIDE.md](./packages/webview2-deepseek/VSCODE_EXTENSION_GUIDE.md) |
| **Architecture Comparison** | [packages/webview2-deepseek/CLARIFICATION.md](./packages/webview2-deepseek/CLARIFICATION.md) |
| **Migration Guide** | [./MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) |
| **Original Qwen Code Docs** | [https://qwenlm.github.io/qwen-code-docs/](https://qwenlm.github.io/qwen-code-docs/) |

---

<div align="center">

**Built with ❤️ by the Qwen Team and Contributors**

[Get Started](#quick-start) · [Documentation](#documentation-index) · [GitHub](https://github.com/QwenLM/qwen-code)

</div>
