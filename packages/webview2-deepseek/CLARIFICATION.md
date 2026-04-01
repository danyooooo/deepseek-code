# DeepSeek VSCode Integration - Clarification

## Understanding the Architecture

Based on your clarification, here's what you want:

1. **Official DeepSeek Chat**: Use https://chat.deepseek.com as the chat interface
2. **VSCode Extension**: Embed DeepSeek in a VSCode sidebar/panel (like Qwen Code Assist did)
3. **Tool Bridge**: Give DeepSeek access to Qwen Code's filesystem tools (read_file, write_file, edit, etc.)

## Two Approaches

### Approach 1: Embed DeepSeek Web UI (Recommended) ⭐

This embeds the actual https://chat.deepseek.com website in a VSCode webview panel.

```
┌─────────────────────────────────────────────────┐
│              VSCode Extension                    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Sidebar Panel                            │   │
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
│  │  • Intercepts tool calls                 │   │
│  │  • Executes Qwen Code tools              │   │
│  │  • Returns results to DeepSeek           │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  Qwen Code Tools                         │   │
│  │  read_file, write_file, edit, grep...    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Official DeepSeek UI (familiar to users)
- ✅ No API key needed in extension (use existing DeepSeek account)
- ✅ DeepSeek handles all conversation logic
- ✅ Automatic DeepSeek model updates

**Cons:**
- ⚠️ Requires DeepSeek to support tool calling via postMessage
- ⚠️ May need a userscript/injection for tool call handling
- ⚠️ CORS restrictions may prevent iframe embedding

**Implementation:** See `DEEPSEEK_WEBVIEW_EXTENSION.md`

---

### Approach 2: Custom UI with DeepSeek API

Build a custom chat UI in VSCode that calls DeepSeek API directly.

```
┌─────────────────────────────────────────────────┐
│              VSCode Extension                    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Sidebar Panel (Custom UI)                │   │
│  │  • Custom chat interface                 │   │
│  │  • Built with React/HTML/CSS             │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    │ HTTP API                    │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  DeepSeek API                            │   │
│  │  api.deepseek.com                        │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Extension Host (Node.js)                │   │
│  │  • Sends tools to DeepSeek               │   │
│  │  • Executes tool calls                   │   │
│  │  • Returns results                       │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  Qwen Code Tools                         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Full control over UI and tool handling
- ✅ No iframe/CORS issues
- ✅ Can use OpenAI-compatible tool calling format

**Cons:**
- ❌ Requires building custom chat UI
- ❌ Need to manage API keys in extension
- ❌ More development work

**Implementation:** See `VSCODE_EXTENSION_GUIDE.md`

---

## Recommended Approach: Hybrid

For the best of both worlds:

1. **Embed DeepSeek web UI** in VSCode webview (for chat)
2. **Run local Tool API server** (for tool execution)
3. **Use a userscript** on chat.deepseek.com to intercept tool calls

### How It Works

```javascript
// Tampermonkey/Greasemonkey script on chat.deepseek.com
(function() {
  // Intercept tool calls from DeepSeek
  window.addEventListener('tool_call', async (event) => {
    const { toolName, params, toolCallId } = event.detail;
    
    // Call local Tool API server
    const response = await fetch('http://localhost:3456/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, params })
    });
    
    const result = await response.json();
    
    // Send result back to DeepSeek
    window.postMessage({
      type: 'tool_result',
      toolCallId,
      result
    }, '*');
  });
})();
```

### Setup Steps

1. **Install VSCode extension** (provides webview panel)
2. **Start Tool API server**: `npm run start:webview2`
3. **Install userscript** in browser (Tampermonkey + script)
4. **Open DeepSeek panel** in VSCode
5. **Chat with DeepSeek** - tools work automatically!

---

## Implementation Files

| File | Purpose |
|------|---------|
| `DEEPSEEK_WEBVIEW_EXTENSION.md` | Guide for embedding DeepSeek web UI |
| `VSCODE_EXTENSION_GUIDE.md` | Guide for custom UI with DeepSeek API |
| `packages/webview2-deepseek/tool-api-server.js` | Local tool execution server |
| `packages/webview2-deepseek/src/toolInterceptor.ts` | Intercept tool calls |
| `packages/webview2-deepseek/userscript/deepseek-tools.user.js` | Browser userscript (to be created) |

---

## Quick Comparison

| Feature | Embed Web UI | Custom UI |
|---------|-------------|-----------|
| UI | Official DeepSeek | Custom built |
| API Key | Not needed (browser) | Required in extension |
| Tool Support | Via userscript | Native |
| Development Effort | Low | High |
| Maintenance | Low | Medium |
| CORS Issues | Possible | None |
| User Experience | Familiar | Customizable |

---

## Next Steps

### For Approach 1 (Embed Web UI):

1. Create VSCode extension with webview panel
2. Load https://chat.deepseek.com in iframe
3. Create userscript for tool interception
4. Run Tool API server locally
5. Test tool calls end-to-end

### For Approach 2 (Custom UI):

1. Create VSCode extension with custom webview
2. Implement chat UI (React/HTML)
3. Integrate DeepSeek API client
4. Add tool calling support
5. Test with Qwen Code tools

---

## Questions?

- **Which approach is better?** → Approach 1 (Embed Web UI) for quick setup
- **Can I switch later?** → Yes, both use the same Tool API server
- **Do I need a DeepSeek API key?** → Only for Approach 2
- **Will this work with other AI chats?** → Yes, same pattern works for Claude, Gemini, etc.

---

## License

Apache-2.0
