#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test Script: Tool API Server
 * 
 * Tests the Tool API server endpoints
 */

async function testToolApiServer() {
  const baseUrl = 'http://localhost:3456';
  
  console.log('Testing Tool API Server...');
  console.log(`Base URL: ${baseUrl}`);
  console.log();

  // Test 1: Health check
  console.log('Test 1: Health check');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const health = await healthResponse.json();
    console.log(`✓ Status: ${health.status}`);
    console.log(`✓ Timestamp: ${health.timestamp}`);
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`);
    return;
  }
  console.log();

  // Test 2: Get tools
  console.log('Test 2: Get available tools');
  try {
    const toolsResponse = await fetch(`${baseUrl}/api/tools`);
    const toolsData = await toolsResponse.json();
    console.log(`✓ Found ${toolsData.tools.length} tools`);
    
    // Show first 3 tools
    toolsData.tools.slice(0, 3).forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.function.name}: ${tool.function.description.slice(0, 60)}...`);
    });
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`);
    return;
  }
  console.log();

  // Test 3: Execute read_file tool
  console.log('Test 3: Execute read_file tool');
  try {
    const execResponse = await fetch(`${baseUrl}/api/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'read_file',
        params: { file_path: './package.json' }
      })
    });
    
    const result = await execResponse.json();
    
    if (result.success) {
      console.log(`✓ Tool executed successfully`);
      console.log(`✓ Duration: ${result.durationMs}ms`);
      console.log(`✓ Content length: ${result.content.length} chars`);
    } else {
      console.log(`✗ Tool failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`);
    return;
  }
  console.log();

  // Test 4: Execute glob tool
  console.log('Test 4: Execute glob tool');
  try {
    const execResponse = await fetch(`${baseUrl}/api/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'glob',
        params: { pattern: '*.json' }
      })
    });
    
    const result = await execResponse.json();
    
    if (result.success) {
      const files = JSON.parse(result.content);
      console.log(`✓ Found ${files.length} JSON files`);
      files.slice(0, 5).forEach(f => console.log(`   - ${f}`));
    } else {
      console.log(`✗ Tool failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`);
  }
  console.log();

  // Test 5: Batch execution
  console.log('Test 5: Batch tool execution');
  try {
    const batchResponse = await fetch(`${baseUrl}/api/tools/execute-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolCalls: [
          { toolName: 'glob', params: { pattern: '*.md' } },
          { toolName: 'ls', params: { path: '.' } }
        ]
      })
    });
    
    const batchResult = await batchResponse.json();
    
    if (batchResult.results) {
      console.log(`✓ Executed ${batchResult.results.length} tools`);
      batchResult.results.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.toolName}: ${r.success ? 'success' : 'failed'}`);
      });
    }
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`);
  }
  console.log();

  // Test 6: Permission check
  console.log('Test 6: Permission check (write_file)');
  try {
    const permResponse = await fetch(`${baseUrl}/api/tools/permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'write_file',
        params: { file_path: './test.txt' }
      })
    });
    
    const permResult = await permResponse.json();
    console.log(`✓ Permission: ${permResult.permission}`);
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`);
  }
  console.log();

  console.log('='.repeat(40));
  console.log('All tests completed!');
  console.log('='.repeat(40));
}

// Run tests
testToolApiServer().catch(console.error);
