/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToolRegistry } from '@qwen-code/qwen-code-core';
import type { OpenAITool, DeepSeekToolCall, DeepSeekMessage } from './types.js';
import { convertToolsForDeepSeek, parseToolArguments } from './types.js';

/**
 * DeepSeek API Client with tool calling support
 */
export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private toolRegistry: ToolRegistry | null = null;

  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  }) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.deepseek.com/v1';
    this.model = options.model ?? 'deepseek-chat';
  }

  /**
   * Set the tool registry for automatic tool execution
   */
  setToolRegistry(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Get all available tools in DeepSeek format
   */
  getTools(): OpenAITool[] {
    if (!this.toolRegistry) {
      return [];
    }
    const googleTools = this.toolRegistry.getFunctionDeclarations();
    return convertToolsForDeepSeek(googleTools);
  }

  /**
   * Send a message to DeepSeek with optional tool calling
   */
  async chat(
    messages: DeepSeekMessage[],
    options?: {
      tools?: OpenAITool[];
      maxIterations?: number;
      onToolCall?: (toolCall: DeepSeekToolCall, result: string) => void;
    }
  ): Promise<{
    content: string;
    messages: DeepSeekMessage[];
    toolCalls?: DeepSeekToolCall[];
  }> {
    const maxIterations = options?.maxIterations ?? 10;
    const allMessages = [...messages];
    let toolCalls: DeepSeekToolCall[] = [];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await this.makeRequest({
        model: this.model,
        messages: allMessages,
        tools: options?.tools ?? this.getTools(),
        tool_choice: 'auto'
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;

      // Add assistant message to history
      allMessages.push(assistantMessage);

      // Check for tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        toolCalls = [...(toolCalls), ...assistantMessage.tool_calls];

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const result = await this.executeToolCall(toolCall);
          
          // Notify callback
          if (options?.onToolCall) {
            options.onToolCall(toolCall, result);
          }

          // Add tool result to messages
          allMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result
          });
        }

        // Continue loop - DeepSeek will process tool results
        continue;
      }

      // No tool calls - conversation complete
      return {
        content: assistantMessage.content ?? '',
        messages: allMessages,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };
    }

    throw new Error(`Maximum iterations (${maxIterations}) exceeded`);
  }

  /**
   * Make raw API request to DeepSeek
   */
  private async makeRequest(body: {
    model: string;
    messages: DeepSeekMessage[];
    tools?: OpenAITool[];
    tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
  }): Promise<{ choices: DeepSeekMessage[] }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Execute a tool call using the tool registry
   */
  private async executeToolCall(toolCall: DeepSeekToolCall): Promise<string> {
    if (!this.toolRegistry) {
      return JSON.stringify({ error: 'Tool registry not available' });
    }

    const toolName = toolCall.function.name;
    const tool = this.toolRegistry.getTool(toolName);

    if (!tool) {
      return JSON.stringify({ error: `Tool '${toolName}' not found` });
    }

    try {
      const params = parseToolArguments(toolCall);
      const abortController = new AbortController();
      
      const result = await tool.buildAndExecute(params, abortController.signal);

      // Return llmContent as string
      if (typeof result.llmContent === 'string') {
        return result.llmContent;
      }
      
      // Handle array content
      if (Array.isArray(result.llmContent)) {
        return result.llmContent
          .map(part => typeof part === 'string' ? part : JSON.stringify(part))
          .join('\n');
      }

      return JSON.stringify(result.llmContent);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        tool: toolName
      });
    }
  }

  /**
   * Simple chat without tool calling
   */
  async simpleChat(message: string): Promise<string> {
    const response = await this.makeRequest({
      model: this.model,
      messages: [{ role: 'user', content: message }]
    });

    return response.choices[0].message.content ?? '';
  }
}
