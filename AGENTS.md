# AGENTS.md - Qwen Code Project Context

## Project Overview

**Qwen Code** is an open-source AI agent framework for the terminal and desktop, now enhanced with **DeepSeek WebView2 integration**. It helps developers understand large codebases, automate tedious work, and ship faster.

This project is based on [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) with adaptations to better support Qwen-Coder models and **DeepSeek integration**.

### 🌟 New: DeepSeek WebView2 Integration

This codebase has been enhanced with DeepSeek WebView2 support:

- 🚀 **Official DeepSeek Chat** - Embed https://chat.deepseek.com in VSCode
- 🔧 **Full Tool Access** - All 20+ Qwen Code tools available to DeepSeek
- 📑 **VSCode Extension** - Sidebar panel with tool bridging
- 🖥️ **Desktop App** - WebView2-based Windows application

**Quick Access:**
- VSCode Extension: `packages/vscode-deepseek-webview/`
- WebView2 Package: `packages/webview2-deepseek/`
- Quick Start: [packages/vscode-deepseek-webview/QUICKSTART.md](./packages/vscode-deepseek-webview/QUICKSTART.md)

### Key Features

- **Flexible AI Support**: Works with DeepSeek, OpenAI, Anthropic, Gemini, and more
- **Agentic workflow, feature-rich**: Rich built-in tools (Skills, SubAgents, Plan Mode) for a full agentic workflow
- **Terminal-first, IDE-friendly**: Built for developers who live in the command line, with optional integration for VS Code, Zed, and JetBrains IDEs
- **WebView2 Integration**: Embed DeepSeek chat directly in VSCode with tool access

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Package Manager**: npm with workspaces
- **Build Tool**: esbuild
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **UI Framework**: Ink (React for CLI)
- **WebView2**: Windows desktop app (Microsoft.Web.WebView2)
- **React Version**: 19.x

## Project Structure

```
├── packages/
│   ├── cli/                      # Command-line interface (main entry point)
│   ├── core/                     # Core backend logic and tool implementations
│   ├── vscode-deepseek-webview/  # ⭐ NEW: DeepSeek WebView2 VSCode extension
│   ├── webview2-deepseek/        # ⭐ NEW: DeepSeek WebView2 integration
│   ├── sdk-java/                 # Java SDK
│   ├── sdk-typescript/           # TypeScript SDK
│   ├── test-utils/               # Shared testing utilities
│   ├── vscode-ide-companion/     # VS Code extension companion (original)
│   ├── webui/                    # Web UI components
│   ├── zed-extension/            # Zed editor extension
│   └── channels/                 # Chat platform channels (Telegram, WeChat, etc.)
├── scripts/                      # Build and utility scripts
├── docs/                         # Documentation source
├── docs-site/                    # Documentation website (Next.js)
├── integration-tests/            # End-to-end integration tests
└── eslint-rules/                 # Custom ESLint rules
```

### Package Details

#### `@qwen-code/qwen-code` (packages/cli/)

The main CLI package providing:

- Interactive terminal UI using Ink/React
- Non-interactive/headless mode
- Authentication handling (OAuth, API keys)
- Configuration management
- Command system (`/help`, `/clear`, `/compress`, etc.)

#### `@qwen-code/qwen-code-core` (packages/core/)

Core library containing:

- **Tools**: File operations (read, write, edit, glob, grep), shell execution, web fetch, LSP integration, MCP client
- **Subagents**: Task delegation to specialized agents
- **Skills**: Reusable skill system
- **Models**: Model configuration and registry for DeepSeek, OpenAI, and other providers
- **Services**: Git integration, file discovery, session management
- **LSP Support**: Language Server Protocol integration
- **MCP**: Model Context Protocol implementation

#### `@qwen-code/webview2-deepseek` (packages/webview2-deepseek/) ⭐ NEW

DeepSeek WebView2 integration package:

- **DeepSeek Client**: API client with automatic tool calling
- **Tool Bridge**: Bridges DeepSeek tool calls to Qwen Code tools
- **Tool API Server**: Express-based HTTP server for tool execution
- **WebView2 UI**: Browser-based chat interface
- **.NET Host App**: Windows desktop application

#### `@qwen-code/vscode-deepseek-webview` (packages/vscode-deepseek-webview/) ⭐ NEW

VSCode extension for embedding DeepSeek chat:

- **Sidebar Webview**: DeepSeek chat in VSCode activity bar
- **Panel Mode**: Full editor panel view
- **Tool Integration**: All Qwen Code tools available
- **Permission System**: Control tool access (allow/ask/deny)

## Building and Running

### Prerequisites

- **Node.js**: ~20.19.0 for development (use nvm to manage versions)
- **Git**
- For sandboxing: Docker or Podman (optional but recommended)
- For WebView2: .NET 8 SDK (Windows only)

### Setup

```bash
# Clone and install
git clone https://github.com/QwenLM/qwen-code.git
cd qwen-code
npm install
```

### Build Commands

```bash
# Build all packages
npm run build

# Build everything including WebView2
npm run build:all

# Build only packages
npm run build:packages

# Build WebView2 package
npm run build:webview2

# Build VSCode extension
cd packages/vscode-deepseek-webview
npm run compile

# Development mode with hot reload
npm run dev
```

### Running

```bash
# Start interactive CLI
npm start

# Start WebView2 UI
npm run start:ui

# Start VSCode extension (in VSCode)
cd packages/vscode-deepseek-webview
# Press F5

# Or after global installation
qwen

# Debug mode
npm run debug
```

### Testing

```bash
# Run all unit tests
npm run test

# Run integration tests (no sandbox)
npm run test:e2e

# Run WebView2 tests
npm run test:webview2

# Run all integration tests with different sandbox modes
npm run test:integration:all
```

### Code Quality

```bash
# Run all checks (lint, format, build, test)
npm run preflight

# Lint only
npm run lint
npm run lint:fix

# Format only
npm run format

# Type check
npm run typecheck
```

## Development Conventions

### Code Style

- **Strict TypeScript**: All strict flags enabled (`strictNullChecks`, `noImplicitAny`, etc.)
- **Module System**: ES modules (`"type": "module"`)
- **Import Style**: Node.js native ESM with `.js` extensions in imports
- **No Relative Imports Between Packages**: ESLint enforces this restriction

### Key Configuration Files

- `tsconfig.json`: Base TypeScript configuration with strict settings
- `eslint.config.js`: ESLint flat config with custom rules
- `esbuild.config.js`: Build configuration
- `vitest.config.ts`: Test configuration

### Import Patterns

```typescript
// Within a package - use relative paths
import { something } from './utils/something.js';

// Between packages - use package names
import { Config } from '@qwen-code/qwen-code-core';
import { ToolBridge } from '@qwen-code/webview2-deepseek';
```

## DeepSeek WebView2 Architecture

### VSCode Extension Flow

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
│                    │ postMessage (tool calls)    │
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

1. User asks DeepSeek: "Read the main.ts file"
2. DeepSeek generates tool_call request
3. Extension intercepts via postMessage
4. ToolBridge executes Qwen Code tool
5. Result returns to DeepSeek
6. DeepSeek continues conversation with tool result

## Authentication Methods

### DeepSeek WebView2 (Recommended)

**No API key needed!** The WebView2 extension uses your browser session at https://chat.deepseek.com.

### API Key (Alternative)

1. **DeepSeek API**: Via `DEEPSEEK_API_KEY` environment variable
2. **OpenAI-compatible**: Via `OPENAI_API_KEY` environment variable
3. **Anthropic**: Via `ANTHROPIC_API_KEY` environment variable
4. **Google GenAI**: Via `GEMINI_API_KEY` environment variable

Environment variables for API mode:

```bash
export DEEPSEEK_API_KEY="sk-your-api-key"
export DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"  # optional
export DEEPSEEK_MODEL="deepseek-chat"                    # optional
```

### Configuration File

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

## Debugging

### VSCode

Press `F5` to launch with debugger attached, or:

```bash
npm run debug  # Runs with --inspect-brk
```

### WebView2 Extension

1. Open `packages/vscode-deepseek-webview` in VSCode
2. Press `F5` to launch Extension Development Host
3. Check Output panel for logs

### React DevTools (for CLI UI)

```bash
DEV=true npm start
npx react-devtools@4.28.5
```

### Sandbox Debugging

```bash
DEBUG=1 qwen
```

## Documentation

- **User documentation**: https://qwenlm.github.io/qwen-code-docs/
- **VSCode Extension Guide**: [packages/vscode-deepseek-webview/README.md](./packages/vscode-deepseek-webview/README.md)
- **Quick Start**: [packages/vscode-deepseek-webview/QUICKSTART.md](./packages/vscode-deepseek-webview/QUICKSTART.md)
- **WebView2 Package**: [packages/webview2-deepseek/README.md](./packages/webview2-deepseek/README.md)
- **Local docs development**:

  ```bash
  cd docs-site
  npm install
  npm run link  # Links ../docs to content
  npm run dev   # http://localhost:3000
  ```

## Contributing Guidelines

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines. Key points:

1. Link PRs to existing issues
2. Keep PRs small and focused
3. Use Draft PRs for WIP
4. Ensure `npm run preflight` passes
5. Update documentation for user-facing changes
6. Follow Conventional Commits for commit messages

## Useful Commands Reference

| Command             | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `npm start`         | Start CLI in interactive mode                                        |
| `npm run start:ui`  | Start WebView2 UI in browser                                         |
| `npm run dev`       | Development mode with hot reload                                     |
| `npm run build`     | Build all packages                                                   |
| `npm run test`      | Run unit tests                                                       |
| `npm run test:e2e`  | Run integration tests                                                |
| `npm run preflight` | Full CI check (clean, install, format, lint, build, typecheck, test) |
| `npm run lint`      | Run ESLint                                                           |
| `npm run format`    | Run Prettier                                                         |
| `npm run clean`     | Clean build artifacts                                                |

## Session Commands (within CLI)

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/compress` - Compress history to save tokens
- `/stats` - Show session information
- `/bug` - Submit bug report
- `/exit` or `/quit` - Exit Qwen Code

## VSCode Extension Commands

- `DeepSeek: Open` - Open chat in editor panel
- `DeepSeek: Focus` - Focus the chat panel
- `DeepSeek: New Conversation` - Start a new conversation
- `DeepSeek: Start Tool API Server` - Start the tool server

---

## Acknowledgments

This project builds upon:

- **[Qwen Code](https://github.com/QwenLM/qwen-code)** (Original) - Core tool infrastructure
- **[Google Gemini CLI](https://github.com/google-gemini/gemini-cli)** - Original inspiration
- **[DeepSeek](https://deepseek.com/)** - AI model provider
