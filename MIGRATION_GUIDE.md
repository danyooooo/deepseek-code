# DeepSeek WebView2 Migration Guide

## Overview

This codebase has been rewritten to focus on **DeepSeek WebView2** integration while maintaining all the core Qwen Code tool functionality. The `/src` folder has been removed and all DeepSeek-related code is now in `packages/webview2-deepseek`.

## What Changed

### Removed
- `/src` folder (merged into packages)
- Qwen OAuth focus (now API-key focused for DeepSeek)

### Added/Enhanced
- `packages/webview2-deepseek` - Complete DeepSeek integration
- WebView2 desktop application support
- HTTP API server for tool execution
- IDE integration (VSCode, JetBrains, Cursor, Windsurf)

### Maintained
- All 20+ Qwen Code tools (read_file, write_file, edit, grep, shell, etc.)
- Core tool registry and filesystem access
- Permission system
- MCP protocol support

## Quick Start

### For Existing Users

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start DeepSeek WebView2 UI
npm run start:ui

# Or start the traditional CLI
npm start
```

### Configuration

Create or update `~/.qwen/settings.json`:

```json
{
  "deepSeek": {
    "apiKey": "sk-your-deepseek-api-key",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat"
  }
}
```

## Package Structure

```
qwen-code/
├── packages/
│   ├── core/                    # Core tool infrastructure (unchanged)
│   ├── cli/                     # Traditional CLI (adapted for DeepSeek)
│   ├── webview2-deepseek/       # NEW: DeepSeek WebView2 integration
│   ├── webui/                   # Web UI components
│   ├── sdk-typescript/          # TypeScript SDK
│   └── ...
├── scripts/                     # Build scripts
├── docs/                        # Documentation
└── integration-tests/           # E2E tests
```

## Using DeepSeek WebView2

### Option 1: Browser UI

```bash
npx qwen-deepseek ui
```

This starts:
1. Tool API server on port 3456
2. Opens browser with chat interface

### Option 2: API Server Only

```bash
npx qwen-deepseek server --port 8080
```

Use the API directly:

```bash
# Get available tools
curl http://localhost:8080/api/tools

# Execute a tool
curl -X POST http://localhost:8080/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"toolName": "read_file", "params": {"file_path": "./main.ts"}}'
```

### Option 3: IDE Integration

#### VSCode Extension

```typescript
import { activateDeepSeekChat } from '@qwen-code/webview2-deepseek/vscode';

export async function activate(context: vscode.ExtensionContext) {
  const deepseek = await activateDeepSeekChat(context);
  deepseek.openChat();
}
```

#### Auto-Discovery

```typescript
import { getExistingServer } from '@qwen-code/webview2-deepseek/ide';

const server = getExistingServer();
if (server) {
  console.log(`DeepSeek Chat running on ${server.url}`);
}
```

## API Reference

### Tool API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/tools` | GET | Get all tools (DeepSeek format) |
| `/api/tools/execute` | POST | Execute a tool |
| `/api/tools/execute-batch` | POST | Execute multiple tools |
| `/api/tools/permission` | POST | Check tool permission |

### Available Tools

All Qwen Code tools are available:

- `read_file` - Read file content
- `write_file` - Write content to file
- `edit` - Find-and-replace in file
- `glob` - Find files by pattern
- `grep` - Search file contents
- `ls` - List directory contents
- `shell` - Execute shell commands
- `web_fetch` - Fetch web content
- `todo_write` - Manage task list
- `ask_user_question` - Ask user for input
- `memory` - Read/write persistent notes
- And more...

## Authentication

### DeepSeek API Key

1. Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Set via environment variable:
   ```bash
   export DEEPSEEK_API_KEY="sk-your-api-key"
   ```
3. Or in `~/.qwen/settings.json`:
   ```json
   {
     "deepSeek": {
       "apiKey": "sk-your-api-key"
     }
   }
   ```

## Building from Source

### Prerequisites

- Node.js 20+
- npm 9+
- (Optional) .NET 8 SDK for WebView2 host app

### Build Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build WebView2 package
cd packages/webview2-deepseek
npm run build

# Build .NET host app (Windows)
cd packages/webview2-deepseek/host-app
dotnet build
```

## Testing

```bash
# Run all tests
npm test

# Run WebView2 tests
npm run test:webview2

# Integration tests
npm run test:e2e
```

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
npx qwen-deepseek server --port 8080
```

### Tool API Server Won't Start

1. Ensure Node.js 20+ is installed
2. Check if port is available
3. Verify `@qwen-code/qwen-code-core` is installed

### WebView2 Not Loading

1. Install WebView2 runtime
2. Check .NET 8 SDK is installed
3. Verify appsettings.json exists

## Migration Checklist

- [ ] Install dependencies: `npm install`
- [ ] Build packages: `npm run build`
- [ ] Get DeepSeek API key
- [ ] Configure `~/.qwen/settings.json`
- [ ] Test CLI: `npm start`
- [ ] Test WebView2 UI: `npm run start:ui`
- [ ] Update IDE extensions (if applicable)

## Support

- [GitHub Issues](https://github.com/QwenLM/qwen-code/issues)
- [Discord](https://discord.gg/RN7tqZCeDK)
- [Documentation](https://qwenlm.github.io/qwen-code-docs/)

## License

Apache-2.0
