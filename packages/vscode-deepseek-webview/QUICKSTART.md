# Quick Start: DeepSeek WebView VSCode Extension

Get started with DeepSeek chat in VSCode in under 5 minutes!

## Prerequisites

- VSCode 1.85.0 or higher
- Node.js 20 or higher
- A DeepSeek account (free at https://chat.deepseek.com)

## Installation (5 Steps)

### Step 1: Open Terminal

```bash
cd c:\AntigravityProjects\qwen-code\packages\vscode-deepseek-webview
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Extension

```bash
npm run compile
```

### Step 4: Open in VSCode

```bash
code .
```

### Step 5: Launch Extension Development Host

1. In VSCode, press `F5` (or Run → Start Debugging)
2. A new VSCode window opens ("Extension Development Host")
3. You'll see the **DeepSeek Chat** icon in the activity bar (left sidebar)

## First Use

### 1. Open DeepSeek Chat

- Click the **DeepSeek Chat** icon in the activity bar
- Or press `Ctrl+Shift+P` → Type "DeepSeek: Open" → Press Enter

### 2. Log In to DeepSeek

- The DeepSeek chat page loads in the sidebar
- Log in with your DeepSeek account (if not already logged in)
- This is the official DeepSeek website in an iframe

### 3. Start Chatting!

Try these prompts:

```
What files are in this project?
Read the main.ts file and explain it
Find all usages of the Config class
Help me refactor this function
```

### 4. Tool Permissions

When DeepSeek wants to use a tool:

- **Allow**: Execute this time only
- **Always Allow**: Skip prompts for this tool
- **Deny**: Block this execution
- **Always Deny**: Never allow this tool

## Configuration (Optional)

### Change Tool Permissions

Open VSCode Settings (`Ctrl+,`) → Search for "deepseek-webview":

```json
{
  "deepseek-webview.toolPermissions": {
    "read_file": "allow",      // Auto-allow reading files
    "write_file": "ask",       // Ask before writing
    "edit": "ask",             // Ask before editing
    "shell": "ask",            // Ask before running commands
    "glob": "allow",           // Auto-allow file search
    "grep": "allow"            // Auto-allow text search
  }
}
```

### Change Tool Server Port

If port 3456 is already in use:

```json
{
  "deepseek-webview.toolServerPort": 3457
}
```

## Troubleshooting

### DeepSeek Page Doesn't Load

**Problem**: The DeepSeek chat page shows an error or blank screen

**Solutions**:
1. Check your internet connection
2. Try opening in panel mode instead: `Ctrl+Shift+P` → "DeepSeek: Open"
3. Some browsers block iframes - try a different browser

### Tools Not Working

**Problem**: DeepSeek can't read files or use tools

**Solutions**:
1. Check if tool server is running:
   - Look for notification: "DeepSeek Tool API server started on port 3456"
   - Or run: `Ctrl+Shift+P` → "DeepSeek: Start Tool API Server"

2. Check workspace access:
   - Open a folder in VSCode: `File` → `Open Folder`
   - Tools need a workspace to access files

3. Check Output panel:
   - `View` → `Output`
   - Select "DeepSeek WebView" from dropdown
   - Look for error messages

### Extension Doesn't Appear

**Problem**: No DeepSeek icon in activity bar

**Solutions**:
1. Reload VSCode window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Make sure you pressed F5 to launch the Extension Development Host
3. Check the extension is activated: `Ctrl+Shift+P` → "Developer: Show Running Extensions"

## Tips & Tricks

### Tip 1: Open in Panel Mode

For a larger chat area:
- `Ctrl+Shift+P` → "DeepSeek: Open"
- Opens DeepSeek in a full editor panel instead of sidebar

### Tip 2: New Conversation

Start fresh:
- `Ctrl+Shift+P` → "DeepSeek: New Conversation"
- Or click the "+ New Chat" button in the toolbar

### Tip 3: Keyboard Shortcuts

Add custom shortcuts in `keybindings.json`:

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

### Tip 4: Check Tool Server Status

Test if the tool server is running:

```bash
curl http://localhost:3456/health
```

Expected response:
```json
{
  "status": "ok",
  "port": 3456,
  "workspace": "/path/to/your/project",
  "timestamp": "2025-04-01T12:00:00.000Z"
}
```

### Tip 5: View Available Tools

See which tools DeepSeek can use:

```bash
curl http://localhost:3456/api/tools
```

## Example Workflows

### Workflow 1: Code Review

```
You: Read the src/main.ts file and review it for bugs

DeepSeek: [uses read_file tool]
DeepSeek: I found a potential issue on line 42...
```

### Workflow 2: Refactoring

```
You: Help me refactor the UserService class to use dependency injection

DeepSeek: [uses read_file, glob to find related files]
DeepSeek: [uses edit to apply changes]
DeepSeek: Refactoring complete!
```

### Workflow 3: Testing

```
You: Run the tests and tell me which ones fail

DeepSeek: [uses shell to run: npm test]
DeepSeek: 3 tests passed, 2 tests failed. Here are the details...
```

### Workflow 4: Documentation

```
You: Generate documentation for all public functions in src/utils.ts

DeepSeek: [uses read_file]
DeepSeek: [uses write_file to create docs]
DeepSeek: Documentation generated in docs/utils.md
```

## Next Steps

1. **Explore the extension**: Try different tools and prompts
2. **Customize settings**: Adjust permissions to your workflow
3. **Read the full docs**: [README.md](./README.md)
4. **Report issues**: https://github.com/QwenLM/qwen-code/issues

## Support

- **Documentation**: [README.md](./README.md)
- **Issues**: https://github.com/QwenLM/qwen-code/issues
- **Discord**: https://discord.gg/RN7tqZCeDK

---

**Happy Coding with DeepSeek! 🚀**
