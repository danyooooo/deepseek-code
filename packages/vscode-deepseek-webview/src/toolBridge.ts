/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolRegistry, Config } from '@qwen-code/qwen-code-core';

/**
 * Tool Execution Result
 */
export interface ToolExecutionResult {
  success: boolean;
  content?: any;
  display?: string;
  error?: string;
}

/**
 * Tool Bridge Configuration
 */
export interface ToolBridgeOptions {
  workspace: string;
}

/**
 * Tool Bridge
 * 
 * Bridges DeepSeek tool calls to Qwen Code tools
 */
export class ToolBridge {
  private toolRegistry: ToolRegistry | undefined;
  private workspace: string;
  private initialized: boolean = false;

  constructor(options: ToolBridgeOptions) {
    this.workspace = options.workspace;
  }

  /**
   * Initialize the tool bridge
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create configuration
      const config = new Config({
        targetDir: this.workspace
      });

      // Create tool registry
      this.toolRegistry = new ToolRegistry(config);

      // Discover all available tools
      await this.toolRegistry.discoverAllTools();

      const tools = this.toolRegistry.getAllToolNames();
      console.log(`[ToolBridge] Discovered ${tools.length} tools: ${tools.join(', ')}`);

      this.initialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ToolBridge] Initialization error:', errorMessage);
      throw new Error(`Failed to initialize tool bridge: ${errorMessage}`);
    }
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    params: Record<string, any>
  ): Promise<ToolExecutionResult> {
    try {
      // Ensure initialized
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.toolRegistry) {
        throw new Error('Tool registry not initialized');
      }

      // Get the tool
      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found`);
      }

      // Execute the tool
      const result = await tool.buildAndExecute(
        params,
        new AbortController().signal
      );

      return {
        success: true,
        content: result.llmContent,
        display: result.returnDisplay
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ToolBridge] Tool execution error (${toolName}):`, errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): Array<{ name: string; description: string }> {
    if (!this.toolRegistry) {
      return [];
    }

    const tools = this.toolRegistry.getFunctionDeclarations();
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolName: string): boolean {
    if (!this.toolRegistry) {
      return false;
    }
    return !!this.toolRegistry.getTool(toolName);
  }
}
