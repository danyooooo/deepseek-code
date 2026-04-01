/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToolRegistry, ToolResult } from '@qwen-code/qwen-code-core';
import type { OpenAITool } from './types.js';
import { convertToolsForDeepSeek } from './types.js';

/**
 * Tool execution result with metadata
 */
export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  content: string;
  display?: string;
  error?: string;
  durationMs?: number;
}

/**
 * Permission decision for tool execution
 */
export type PermissionDecision = 'allow' | 'ask' | 'deny';

/**
 * Bridge between DeepSeek and Qwen Code tools
 */
export class ToolBridge {
  private toolRegistry: ToolRegistry;
  private allowedTools: Set<string> = new Set();
  private deniedTools: Set<string> = new Set();

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Get all tools in DeepSeek-compatible format
   */
  getToolsForDeepSeek(): OpenAITool[] {
    const googleTools = this.toolRegistry.getFunctionDeclarations();
    return convertToolsForDeepSeek(googleTools);
  }

  /**
   * Get all tool names
   */
  getAllToolNames(): string[] {
    return this.toolRegistry.getAllToolNames();
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolName: string): boolean {
    return this.toolRegistry.getTool(toolName) !== undefined;
  }

  /**
   * Get default permission for a tool
   */
  async getDefaultPermission(toolName: string, params: Record<string, unknown>): Promise<PermissionDecision> {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      return 'deny';
    }

    try {
      const invocation = tool.build(params);
      return await invocation.getDefaultPermission();
    } catch {
      return 'deny';
    }
  }

  /**
   * Execute a tool with the given parameters
   */
  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
    options?: {
      signal?: AbortSignal;
    }
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const tool = this.toolRegistry.getTool(toolName);

    if (!tool) {
      return {
        toolName,
        success: false,
        content: JSON.stringify({ error: `Tool '${toolName}' not found` }),
        error: `Tool '${toolName}' not found`
      };
    }

    try {
      const abortSignal = options?.signal ?? new AbortController().signal;
      const result: ToolResult = await tool.buildAndExecute(params, abortSignal);

      const durationMs = Date.now() - startTime;

      return {
        toolName,
        success: !result.error,
        content: typeof result.llmContent === 'string' 
          ? result.llmContent 
          : JSON.stringify(result.llmContent),
        display: typeof result.returnDisplay === 'string'
          ? result.returnDisplay
          : undefined,
        error: result.error?.message,
        durationMs
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        toolName,
        success: false,
        content: JSON.stringify({ error: errorMessage }),
        error: errorMessage,
        durationMs
      };
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeTools(
    toolCalls: Array<{
      toolName: string;
      params: Record<string, unknown>;
    }>,
    options?: {
      signal?: AbortSignal;
    }
  ): Promise<ToolExecutionResult[]> {
    const results = await Promise.all(
      toolCalls.map(call => this.executeTool(call.toolName, call.params, options))
    );
    return results;
  }

  /**
   * Allow a tool for the current session
   */
  allowTool(toolName: string): void {
    this.allowedTools.add(toolName);
    this.deniedTools.delete(toolName);
  }

  /**
   * Deny a tool for the current session
   */
  denyTool(toolName: string): void {
    this.deniedTools.add(toolName);
    this.allowedTools.delete(toolName);
  }

  /**
   * Check if a tool is explicitly allowed or denied
   */
  isToolAllowed(toolName: string): boolean | null {
    if (this.deniedTools.has(toolName)) return false;
    if (this.allowedTools.has(toolName)) return true;
    return null; // Not decided yet
  }

  /**
   * Get tool description
   */
  getToolDescription(toolName: string): string | null {
    const tool = this.toolRegistry.getTool(toolName);
    return tool?.description ?? null;
  }

  /**
   * Get all tools with their descriptions
   */
  getAllToolDescriptions(): Array<{ name: string; description: string }> {
    return this.toolRegistry.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }
}
