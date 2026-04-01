/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Main entry point for @qwen-code/webview2-deepseek package
 *
 * This package provides DeepSeek AI integration with full access
 * to Qwen Code's filesystem tools via WebView2 or API.
 *
 * @module @qwen-code/webview2-deepseek
 */

export { DeepSeekClient } from './DeepSeekClient.js';
export { ToolBridge } from './ToolBridge.js';
export { ToolApiServer } from './ToolApiServer.js';
export * from './types.js';
export type { ToolExecutionResult, PermissionDecision } from './ToolBridge.js';

// Re-export for convenience (from compiled JS files)
// For IDE integrations, import from '@qwen-code/webview2-deepseek/ide'
// For VSCode integrations, import from '@qwen-code/webview2-deepseek/vscode'
