#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example: Using DeepSeek Client with Tool Bridge
 * 
 * This script demonstrates how to use the DeepSeek client
 * with Qwen Code tools programmatically.
 */

import { DeepSeekClient, ToolBridge } from './dist/index.js';
import { Config, ToolRegistry } from '@qwen-code/qwen-code-core';

async function main() {
  console.log('='.repeat(60));
  console.log('DeepSeek + Qwen Code Tools - Example');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Create configuration
  console.log('1. Creating configuration...');
  const config = new Config({
    targetDir: process.cwd()
  });

  // Step 2: Create and initialize tool registry
  console.log('2. Initializing tool registry...');
  const toolRegistry = new ToolRegistry(config);
  await toolRegistry.discoverAllTools();
  
  const tools = toolRegistry.getAllToolNames();
  console.log(`   Discovered ${tools.length} tools:`);
  console.log(`   ${tools.slice(0, 10).join(', ')}${tools.length > 10 ? '...' : ''}`);
  console.log();

  // Step 3: Create tool bridge
  console.log('3. Creating tool bridge...');
  const bridge = new ToolBridge(toolRegistry);
  
  const deepSeekTools = bridge.getToolsForDeepSeek();
  console.log(`   Converted ${deepSeekTools.length} tools for DeepSeek`);
  console.log();

  // Step 4: Example - Execute a tool directly
  console.log('4. Example: Direct tool execution');
  console.log('   Tool: read_file');
  console.log('   Params: { file_path: "package.json" }');
  
  const result = await bridge.executeTool('read_file', {
    file_path: './package.json'
  });
  
  console.log(`   Success: ${result.success}`);
  console.log(`   Duration: ${result.durationMs}ms`);
  console.log(`   Content preview: ${result.content.slice(0, 100)}...`);
  console.log();

  // Step 5: Show DeepSeek tool format
  console.log('5. DeepSeek tool format example:');
  const firstTool = deepSeekTools[0];
  console.log(JSON.stringify(firstTool, null, 2));
  console.log();

  // Step 6: DeepSeek Client example (requires API key)
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (apiKey) {
    console.log('6. DeepSeek Client example (with API key)');
    
    const client = new DeepSeekClient({
      apiKey,
      model: 'deepseek-chat'
    });
    
    client.setToolRegistry(toolRegistry);
    
    console.log('   Sending message to DeepSeek...');
    console.log('   Message: "List the files in the current directory"');
    
    try {
      const response = await client.chat([
        { role: 'user', content: 'List the files in the current directory using the glob tool' }
      ], {
        onToolCall: (toolCall, result) => {
          console.log(`   Tool called: ${toolCall.function.name}`);
          console.log(`   Result preview: ${result.slice(0, 50)}...`);
        }
      });
      
      console.log();
      console.log('   DeepSeek response:');
      console.log('   ' + response.content.split('\n').join('\n   '));
      
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  } else {
    console.log('6. DeepSeek Client example (skipped - no API key)');
    console.log('   Set DEEPSEEK_API_KEY environment variable to run this example');
  }
  
  console.log();
  console.log('='.repeat(60));
  console.log('Example completed!');
  console.log('='.repeat(60));
}

// Run the example
main().catch(console.error);
