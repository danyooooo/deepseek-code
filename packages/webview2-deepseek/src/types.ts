/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FunctionDeclaration } from '@google/genai';

/**
 * OpenAI/DeepSeek compatible tool format
 */
export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: unknown[];
      }>;
      required?: string[];
    };
  };
}

/**
 * DeepSeek tool call from API response
 */
export interface DeepSeekToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * DeepSeek message format
 */
export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string;
  tool_calls?: DeepSeekToolCall[];
  tool_call_id?: string;
}

/**
 * DeepSeek API request body
 */
export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  tools?: OpenAITool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

/**
 * DeepSeek API response choice
 */
export interface DeepSeekChoice {
  index: number;
  message: DeepSeekMessage;
  finish_reason: 'stop' | 'tool_calls' | 'length';
}

/**
 * DeepSeek API response
 */
export interface DeepSeekResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: DeepSeekChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Convert Google FunctionDeclaration to OpenAI/DeepSeek tool format
 */
export function convertGoogleToolToOpenAI(googleTool: FunctionDeclaration): OpenAITool {
  return {
    type: 'function',
    function: {
      name: googleTool.name,
      description: googleTool.description,
      parameters: googleTool.parametersJsonSchema as OpenAITool['function']['parameters']
    }
  };
}

/**
 * Convert array of Google tools to OpenAI/DeepSeek format
 */
export function convertToolsForDeepSeek(googleTools: FunctionDeclaration[]): OpenAITool[] {
  return googleTools.map(convertGoogleToolToOpenAI);
}

/**
 * Parse tool call arguments
 */
export function parseToolArguments(toolCall: DeepSeekToolCall): Record<string, unknown> {
  try {
    return JSON.parse(toolCall.function.arguments);
  } catch (error) {
    throw new Error(`Failed to parse tool arguments: ${error instanceof Error ? error.message : String(error)}`);
  }
}
