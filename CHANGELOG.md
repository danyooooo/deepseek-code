# Changelog

## 0.15.0 - DeepSeek WebView2 Integration

### 🌟 New Features

#### DeepSeek WebView2 VSCode Extension
- **NEW**: Complete VSCode extension for embedding https://chat.deepseek.com
- Sidebar webview with DeepSeek chat in activity bar
- Panel mode for full editor view
- Tool bridge for executing Qwen Code tools from DeepSeek
- Permission system (allow/ask/deny) for tool control
- Commands: `DeepSeek: Open`, `Focus`, `New Conversation`, `Start Tool Server`
- Configurable settings for URL, port, workspace, and permissions

**Package**: `packages/vscode-deepseek-webview/`

#### DeepSeek WebView2 Integration
- **NEW**: Tool API server for HTTP-based tool execution
- DeepSeek client with automatic tool calling
- Tool bridge converting Qwen tools to DeepSeek format
- WebView2 desktop app (Windows)
- .NET host application for native Windows experience
- Browser-based chat UI

**Package**: `packages/webview2-deepseek/`

### 📦 New Packages

- `@qwen-code/vscode-deepseek-webview` - VSCode extension for DeepSeek chat embedding
- `@qwen-code/webview2-deepseek` - DeepSeek WebView2 integration library

### 🔧 Enhancements

- Updated main README with DeepSeek WebView2 focus
- Added comprehensive documentation for VSCode extension
- Created QUICKSTART.md for 5-minute setup guide
- Added architecture diagrams for WebView2 integration
- Updated AGENTS.md with new package structure
- Created migration guide for existing users

### 📚 Documentation

- `packages/vscode-deepseek-webview/README.md` - Extension documentation
- `packages/vscode-deepseek-webview/QUICKSTART.md` - Quick start guide
- `packages/vscode-deepseek-webview/IMPLEMENTATION_SUMMARY.md` - Technical details
- `packages/webview2-deepseek/VSCODE_EXTENSION_GUIDE.md` - Extension development guide
- `packages/webview2-deepseek/CLARIFICATION.md` - Architecture comparison
- `packages/webview2-deepseek/DEEPSEEK_WEBVIEW_EXTENSION.md` - Implementation guide
- `MIGRATION_GUIDE.md` - Migration from previous versions

### 🐛 Bug Fixes

- Fixed package.json workspace configuration
- Resolved TypeScript compilation issues in core package
- Updated build scripts for new package structure

### 🔒 Security

- Tool permission system for controlling DeepSeek tool access
- Local execution of all tools (no remote code execution)
- Sandbox webview for iframe isolation

### 📝 Acknowledgments

This release integrates DeepSeek while preserving all original Qwen Code functionality:
- Core tool infrastructure from [Qwen Code](https://github.com/QwenLM/qwen-code)
- Architecture inspiration from [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)
- AI models from [DeepSeek](https://deepseek.com/)

---

## 0.0.14

- Added plan mode support for task planning
- Fixed unreliable editCorrector that injects extra escape characters
- Fixed task tool dynamic updates
- Added Qwen3-VL-Plus token limits (256K input, 32K output) and highres support
- Enhanced dashScope cache control

## 0.0.13

- Added YOLO mode support for automatic vision model switching with CLI arguments and environment variables.
- Fixed ripgrep lazy loading to resolve VS Code IDE companion startup issues.
- Fixed authentication hang when selecting Qwen OAuth.
- Added OpenAI and Qwen OAuth authentication support to Zed ACP integration.
- Fixed output token limit for Qwen models.
- Fixed Markdown list display issues on Windows.
- Enhanced vision model instructions and documentation.
- Improved authentication method compatibility across different IDE integrations.

## 0.0.12

- Added vision model support for Qwen-OAuth authentication.
- Synced upstream `gemini-cli` to v0.3.4 with numerous improvements and bug fixes.
- Enhanced subagent functionality with system reminders and improved user experience.
- Added tool call type coercion for better compatibility.
- Fixed arrow key navigation issues on Windows.
- Fixed missing tool call chunks for OpenAI logging.
- Fixed system prompt issues to avoid malformed tool calls.
- Fixed terminal flicker when subagent is executing.
- Fixed duplicate subagents configuration when running in home directory.
- Fixed Esc key unable to cancel subagent dialog.
- Added confirmation prompt for `/init` command when context file exists.
- Added `skipLoopDetection` configuration option.
- Fixed `is_background` parameter reset issues.
- Enhanced Windows compatibility with multi-line paste handling.
- Improved subagent documentation and branding consistency.
- Fixed various linting errors and improved code quality.
- Miscellaneous improvements and bug fixes.

## 0.0.11

- Added subagents feature with file-based configuration system for specialized AI assistants.
- Added Welcome Back Dialog with project summary and enhanced quit options.
- Fixed performance issues with SharedTokenManager causing 20-minute delays.
- Fixed tool calls UI issues and improved user experience.
- Fixed credential clearing when switching authentication types.
- Enhanced subagent capabilities to use tools requiring user confirmation.
- Improved ReadManyFiles tool with shared line limits across files.
