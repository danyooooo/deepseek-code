# Qwen Code DeepSeek WebView VSCode Extension

Embed the official DeepSeek chat (https://chat.deepseek.com) in VSCode with full Qwen Code tool integration.

## Features

- 🚀 **Official DeepSeek UI** - Uses the real chat.deepseek.com interface
- 🔧 **Full Tool Access** - All 20+ Qwen Code tools available (read_file, write_file, edit, grep, shell, etc.)
- 📑 **Sidebar Integration** - Chat panel in VSCode activity bar
- 🖥️ **Panel Mode** - Open DeepSeek in a dedicated editor panel
- 🔐 **Permission System** - Control which tools DeepSeek can use
- 🏠 **Local Execution** - Tools run locally on your machine
- ✅ **No API Key Needed** - Use your existing DeepSeek account in browser

## Installation

### From VSCode Marketplace (Coming Soon)

1. Open VSCode Extensions (Ctrl+Shift+X)
2. Search for "DeepSeek WebView"
3. Click Install

### From Source

```bash
# Clone the repository
git clone https://github.com/QwenLM/qwen-code.git
cd qwen-code/packages/vscode-deepseek-webview

# Install dependencies
npm install

# Build the extension
npm run compile

# Open in VSCode and press F5 to launch Extension Development Host
code .
```

## Usage

### After Installation

1. **DeepSeek sidebar appears** in the VSCode activity bar
2. **Click the DeepSeek icon** to open the chat
3. **Log in to DeepSeek** (if not already logged in)
4. **Start chatting!** DeepSeek can now use local tools

### Commands

| Command | Description |
|---------|-------------|
| `DeepSeek: Open` | Open DeepSeek chat in editor panel |
| `DeepSeek: Focus` | Focus the DeepSeek panel |
| `DeepSeek: New Conversation` | Start a new conversation |
| `DeepSeek: Start Tool API Server` | Manually start the tool server |

### Keyboard Shortcuts

You can add custom keyboard shortcuts in `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+d",
    "command": "deepseek-webview.open"
  },
  {
    "key": "ctrl+shift+n",
    "command": "deepseek-webview.newConversation"
  }
]
```

## Configuration

### Settings

Add to your `settings.json`:

```json
{
  // DeepSeek chat URL
  "deepseek-webview.url": "https://chat.deepseek.com",
  
  // Tool API server port
  "deepseek-webview.toolServerPort": 3456,
  
  // Auto-start tool server on extension activation
  "deepseek-webview.autoStartServer": true,
  
  // Workspace directory for tool access
  "deepseek-webview.workspace": "${workspaceFolder}",
  
  // Tool permissions (allow, ask, deny)
  "deepseek-webview.toolPermissions": {
    "read_file": "allow",
    "write_file": "ask",
    "edit": "ask",
    "glob": "allow",
    "grep": "allow",
    "ls": "allow",
    "shell": "ask",
    "web_fetch": "ask"
  }
}
```

### Tool Permissions

| Permission | Description |
|------------|-------------|
| `allow` | Tool executes automatically without prompting |
| `ask` | Show confirmation dialog before execution |
| `deny` | Block tool execution |

## Example Usage

### Example 1: Read a File

**You**: "Read the main.ts file and explain what it does"

**DeepSeek** → Calls `read_file` tool → Gets content → Provides explanation

### Example 2: Search Code

**You**: "Find all usages of the UserService class"

**DeepSeek** → Calls `grep` tool → Searches files → Lists results

### Example 3: Refactor Code

**You**: "Refactor this function to use async/await"

**DeepSeek** → Calls `read_file` → Generates changes → Calls `edit` → Confirms success

### Example 4: Run Tests

**You**: "Run the tests and tell me if they pass"

**DeepSeek** → Calls `shell` tool → Executes `npm test` → Reports results

## Available Tools

DeepSeek can use these Qwen Code tools:

| Tool | Description | Default Permission |
|------|-------------|-------------------|
| `read_file` | Read file content | allow |
| `write_file` | Write content to file | ask |
| `edit` | Find-and-replace in file | ask |
| `glob` | Find files by pattern | allow |
| `grep` | Search file contents | allow |
| `ls` | List directory contents | allow |
| `shell` | Execute shell commands | ask |
| `web_fetch` | Fetch web page content | ask |
| `todo_write` | Manage task list | allow |
| `ask_user_question` | Ask user for input | ask |
| `memory` | Read/write persistent notes | allow |

## Architecture

```
┌─────────────────────────────────────────────────┐
│              VSCode Extension                    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Sidebar / Panel Webview                 │   │
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
│                    │ Tool Execution              │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  Qwen Code Core Tools                    │   │
│  │  read_file, write_file, edit, etc.       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### DeepSeek page doesn't load

- Check your internet connection
- DeepSeek may have CORS restrictions for iframes
- Try opening in panel mode instead of sidebar

### Tools not working

1. **Check if tool server is running**:
   - Run command: `DeepSeek: Start Tool API Server`
   - Check Output panel for errors

2. **Check workspace access**:
   - Ensure you have a workspace folder open
   - Check `deepseek-webview.workspace` setting

3. **Check tool permissions**:
   - Some tools require explicit permission
   - You'll be prompted to allow/deny each tool call

### Tool server won't start

1. Check if port 3456 is available
2. Try a different port: `"deepseek-webview.toolServerPort": 3457`
3. Check Output panel for error details

### Extension doesn't activate

1. Reload VSCode window (Ctrl+Shift+P → "Developer: Reload Window")
2. Check activation events in package.json
3. Ensure VSCode version is 1.85.0 or higher

## Development

### Build Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Lint
npm run lint

# Test
npm test
```

### Debugging

1. Open `packages/vscode-deepseek-webview` in VSCode
2. Press `F5` to launch Extension Development Host
3. A new VSCode window opens with the extension loaded
4. Use Debug Console for logging

### Extension Structure

```
vscode-deepseek-webview/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── deepseekWebviewPanel.ts   # Panel webview
│   ├── toolBridge.ts             # Tool execution bridge
│   └── toolApiServer.ts          # HTTP API server
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## Security Considerations

- **API Keys**: DeepSeek credentials stay in the browser, not shared with extension
- **Tool Permissions**: Review each tool call before execution (configurable)
- **Workspace Access**: Tools only access the configured workspace directory
- **Network**: Tool API server runs on localhost only (127.0.0.1)
- **Iframe Security**: DeepSeek runs in a sandboxed webview

## Known Limitations

1. **Iframe Restrictions**: DeepSeek may not allow iframe embedding in all browsers
2. **CORS**: Some browsers block cross-origin iframe communication
3. **Session Persistence**: DeepSeek login session may not persist across VSCode restarts
4. **Tool Call Format**: DeepSeek must support custom tool calling format

## Alternatives

If iframe embedding doesn't work:

1. **Use the standalone web app**: Run `npm run start:ui` from qwen-code root
2. **Use browser with userscript**: Install Tampermonkey + tool bridge script
3. **Use custom UI**: Build a custom chat interface with DeepSeek API

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Apache-2.0

## Related

- [Qwen Code](https://github.com/QwenLM/qwen-code) - Main project
- [DeepSeek](https://chat.deepseek.com) - Official DeepSeek chat
- [Qwen Code Tools](../packages/core/src/tools/) - Available tools documentation
