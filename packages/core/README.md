# @qwen-code/qwen-code-core

Core backend library for Qwen Code - Provides 20+ filesystem tools, permission system, and AI model integration.

## Overview

This package contains the core functionality of Qwen Code, including:

- **Tool System**: 20+ built-in tools for file operations, shell commands, web fetching, etc.
- **Permission System**: Fine-grained control over tool execution
- **Model Integration**: Support for DeepSeek, OpenAI, Anthropic, Gemini, and more
- **Services**: File system, Git, LSP, MCP, and more
- **Utilities**: Helper functions for file operations, text processing, etc.

## Installation

```bash
npm install @qwen-code/qwen-code-core
```

## Quick Start

```typescript
import { Config, ToolRegistry, ToolBridge } from '@qwen-code/qwen-code-core';

// Create configuration
const config = new Config({
  targetDir: '/path/to/workspace'
});

// Create tool registry
const toolRegistry = new ToolRegistry(config);
await toolRegistry.discoverAllTools();

// Execute a tool
const tool = toolRegistry.getTool('read_file');
const result = await tool.buildAndExecute(
  { file_path: '/path/to/file.txt' },
  new AbortController().signal
);

console.log(result.llmContent);
```

## Available Tools

### File Operations

| Tool | Description |
|------|-------------|
| `read_file` | Read file content with optional offset/limit |
| `write_file` | Write content to a new file |
| `edit` | Find-and-replace in file with smart diff |
| `glob` | Find files by glob pattern |
| `grep` | Search file contents with regex |
| `ls` | List directory contents |
| `glob_to_list_files` | Find and read multiple files |

### Shell & Process

| Tool | Description |
|------|-------------|
| `shell` | Execute shell commands |
| `shell_start` | Start background shell process |
| `shell_read` | Read from shell process |
| `shell_write` | Write to shell process |

### Web & Network

| Tool | Description |
|------|-------------|
| `web_fetch` | Fetch web page content |
| `web_search` | Search the web |

### Productivity

| Tool | Description |
|------|-------------|
| `todo_write` | Manage task list |
| `memory` | Read/write persistent notes |
| `ask_user_question` | Ask user for input |
| `exit_plan_mode` | Exit plan mode |

### Advanced

| Tool | Description |
|------|-------------|
| `lsp` | Language Server Protocol operations |
| `mcp` | Model Context Protocol client |
| `skill` | Execute reusable skills |
| `agent` | Delegate to subagents |
| `cron_*` | Schedule recurring tasks |

## Tool Registry

The `ToolRegistry` class manages all available tools:

```typescript
import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

const config = new Config({ targetDir: '/workspace' });
const registry = new ToolRegistry(config);

// Discover all tools
await registry.discoverAllTools();

// Get a specific tool
const tool = registry.getTool('read_file');

// Get all tool names
const names = registry.getAllToolNames();

// Get tool declarations for AI
const declarations = registry.getFunctionDeclarations();
```

## Permission System

Control tool execution permissions:

```typescript
import { PermissionManager } from '@qwen-code/qwen-code-core';

const permissionManager = new PermissionManager();

// Check permission
const permission = await permissionManager.getPermission('write_file');
// Returns: 'allow' | 'ask' | 'deny'

// Set permission
await permissionManager.setPermission('shell', 'ask');
```

### Permission Levels

| Level | Description |
|-------|-------------|
| `allow` | Execute without prompting |
| `ask` | Prompt user for confirmation |
| `deny` | Block execution |

## Model Integration

Support for multiple AI providers:

```typescript
import { Config, ModelRegistry } from '@qwen-code/qwen-code-core';

const config = new Config({
  targetDir: '/workspace',
  modelProviders: {
    openai: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        baseUrl: 'https://api.deepseek.com/v1',
        envKey: 'DEEPSEEK_API_KEY'
      }
    ]
  }
});
```

### Supported Providers

- **DeepSeek**: `deepseek-chat`, `deepseek-coder`
- **OpenAI**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Anthropic**: `claude-sonnet-4`, `claude-opus`
- **Google**: `gemini-2.5-pro`, `gemini-2.0-flash`
- **Qwen**: `qwen3-coder-plus`, `qwen3.5-plus`

## Services

### File System Service

```typescript
import { FileSystemService } from '@qwen-code/qwen-code-core';

const fs = new FileSystemService();
const content = await fs.readFile('/path/to/file.txt');
await fs.writeFile('/path/to/file.txt', 'content');
```

### Git Service

```typescript
import { GitService } from '@qwen-code/qwen-code-core';

const git = new GitService('/workspace');
const status = await git.getStatus();
const diff = await git.getDiff();
```

### LSP Service

```typescript
import { LspService } from '@qwen-code/qwen-code-core';

const lsp = new LspService();
await lsp.startServer('typescript', '/workspace');
const definitions = await lsp.getDefinitions('/workspace/src/main.ts', 10, 5);
```

## Configuration

### Basic Configuration

```typescript
import { Config } from '@qwen-code/qwen-code-core';

const config = new Config({
  targetDir: '/workspace',
  excludePatterns: ['node_modules', '.git', 'dist'],
  maxToolIterations: 10,
  fileSystem: 'native' // or 'sandbox'
});
```

### Settings File

Create `~/.qwen/settings.json`:

```json
{
  "workspace": {
    "targetDir": "/path/to/project",
    "excludePatterns": ["node_modules", ".git", "dist"]
  },
  "modelProviders": {
    "openai": [
      {
        "id": "deepseek-chat",
        "name": "DeepSeek Chat",
        "baseUrl": "https://api.deepseek.com/v1",
        "envKey": "DEEPSEEK_API_KEY"
      }
    ]
  },
  "tools": {
    "shell": {
      "enabled": true,
      "requirePermission": true
    }
  }
}
```

## Error Handling

```typescript
import { ToolError, ToolErrorType } from '@qwen-code/qwen-code-core';

try {
  const result = await tool.buildAndExecute(params, signal);
} catch (error) {
  if (error instanceof ToolError) {
    console.error('Tool error:', error.type, error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Tool Error Types

| Type | Description |
|------|-------------|
| `NOT_FOUND` | Tool not found |
| `INVALID_PARAMS` | Invalid parameters |
| `PERMISSION_DENIED` | Tool execution denied |
| `EXECUTION_FAILED` | Tool execution failed |
| `TIMEOUT` | Tool execution timed out |

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

describe('ToolRegistry', () => {
  it('should discover tools', async () => {
    const config = new Config({ targetDir: '/test' });
    const registry = new ToolRegistry(config);
    await registry.discoverAllTools();
    expect(registry.getAllToolNames().length).toBeGreaterThan(0);
  });
});
```

## Architecture

```
┌─────────────────────────────────────────┐
│           ToolRegistry                   │
│  • Manages all tools                    │
│  • Tool discovery                        │
│  • Tool execution                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│           Individual Tools               │
│  • read_file, write_file, edit, ...     │
│  • build() → ToolInvocation             │
│  • execute() → ToolResult               │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│           Services                       │
│  • FileSystemService                    │
│  • GitService                           │
│  • LspService                           │
│  • ShellExecutionService                │
└─────────────────────────────────────────┘
```

## API Reference

### ToolRegistry

```typescript
class ToolRegistry {
  constructor(config: Config);
  discoverAllTools(): Promise<void>;
  getTool(name: string): BaseDeclarativeTool | undefined;
  getAllToolNames(): string[];
  getFunctionDeclarations(): FunctionDeclaration[];
}
```

### Tool Result

```typescript
interface ToolResult {
  llmContent: string | unknown;
  returnDisplay: string;
  error?: {
    message: string;
    type: ToolErrorType;
  };
}
```

### Function Declaration

```typescript
interface FunctionDeclaration {
  name: string;
  description: string;
  parametersJsonSchema?: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}
```

## DeepSeek Integration

This package is used by the DeepSeek WebView2 integration:

- `packages/vscode-deepseek-webview/` - VSCode extension
- `packages/webview2-deepseek/` - WebView2 desktop app

See [DEEPSEEK_INTEGRATION.md](../../DEEPSEEK_INTEGRATION.md) for details.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

Apache-2.0

## Acknowledgments

This package is part of the [Qwen Code](https://github.com/QwenLM/qwen-code) project, based on [Google Gemini CLI](https://github.com/google-gemini/gemini-cli).
