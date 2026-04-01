#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standalone Tool API Server
 *
 * This script starts an HTTP server that exposes Qwen Code tools via REST API.
 * It can be used independently or as part of the WebView2 DeepSeek integration.
 *
 * Usage:
 *   node tool-api-server.js --port 3456 --workspace /path/to/workspace
 */

import { Config, ToolRegistry } from '@qwen-code/qwen-code-core';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: 3456,
    workspace: process.cwd()
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      options.port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--workspace' && args[i + 1]) {
      options.workspace = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Tool API Server - Expose Qwen Code tools via HTTP

Usage:
  node tool-api-server.js [options]

Options:
  --port <number>      Port to listen on (default: 3456)
  --workspace <path>   Workspace directory (default: current directory)
  --help, -h           Show this help message

Examples:
  node tool-api-server.js
  node tool-api-server.js --port 8080 --workspace /my/project
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Tool API Server Class
 */
class ToolApiServer {
  constructor(options) {
    this.options = options;
    this.toolRegistry = options.toolRegistry;
    this.port = options.port || 3456;
    this.app = express();
    this.server = null;

    // Convert Google FunctionDeclaration to OpenAI/DeepSeek format
    this.convertGoogleToolToOpenAI = (googleTool) => {
      return {
        type: 'function',
        function: {
          name: googleTool.name,
          description: googleTool.description,
          parameters: googleTool.schema?.parametersJsonSchema || googleTool.parametersJsonSchema
        }
      };
    };
  }

  /**
   * Initialize the server
   */
  async initialize() {
    // Setup middleware
    this.app.use(cors());
    this.app.use(express.json());

    // Setup routes
    this.setupRoutes();

    // Create tool registry if not provided
    if (!this.toolRegistry) {
      const config = new Config({
        targetDir: this.options.workspace || process.cwd()
      });

      this.toolRegistry = new ToolRegistry(config);
      await this.toolRegistry.discoverAllTools();

      const tools = this.toolRegistry.getAllToolNames();
      console.log(`Discovered ${tools.length} tools: ${tools.join(', ')}`);
    }
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: this.port,
        workspace: this.options.workspace
      });
    });

    // Get all tools (DeepSeek format)
    this.app.get('/api/tools', (req, res) => {
      try {
        const tools = this.toolRegistry.getFunctionDeclarations();
        const openaiTools = tools.map(this.convertGoogleToolToOpenAI);

        res.json({
          tools: openaiTools,
          count: openaiTools.length
        });
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // List tools with descriptions
    this.app.get('/api/tools/list', (req, res) => {
      try {
        const tools = this.toolRegistry.getFunctionDeclarations();
        const toolList = tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.schema?.parametersJsonSchema || tool.parametersJsonSchema
        }));

        res.json({
          tools: toolList,
          count: toolList.length
        });
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Execute a single tool
    this.app.post('/api/tools/execute', async (req, res) => {
      try {
        const { toolName, params } = req.body;

        if (!toolName) {
          return res.status(400).json({
            error: 'toolName is required'
          });
        }

        const tool = this.toolRegistry.getTool(toolName);
        if (!tool) {
          return res.status(404).json({
            error: `Tool '${toolName}' not found`
          });
        }

        const startTime = Date.now();
        const result = await tool.buildAndExecute(
          params || {},
          new AbortController().signal
        );

        res.json({
          toolName,
          success: true,
          content: result.llmContent,
          display: result.returnDisplay,
          durationMs: Date.now() - startTime
        });
      } catch (error) {
        res.status(500).json({
          toolName: req.body.toolName,
          success: false,
          error: error.message,
          type: error.type || 'unknown'
        });
      }
    });

    // Execute multiple tools in batch
    this.app.post('/api/tools/execute-batch', async (req, res) => {
      try {
        const { toolCalls } = req.body;

        if (!Array.isArray(toolCalls)) {
          return res.status(400).json({
            error: 'toolCalls must be an array'
          });
        }

        const results = await Promise.all(
          toolCalls.map(async (call) => {
            try {
              const { toolName, params } = call;
              const tool = this.toolRegistry.getTool(toolName);

              if (!tool) {
                return {
                  toolName,
                  success: false,
                  error: `Tool '${toolName}' not found`
                };
              }

              const result = await tool.buildAndExecute(
                params || {},
                new AbortController().signal
              );

              return {
                toolName,
                success: true,
                content: result.llmContent,
                display: result.returnDisplay
              };
            } catch (error) {
              return {
                toolName: call.toolName,
                success: false,
                error: error.message
              };
            }
          })
        );

        res.json({
          results,
          count: results.length
        });
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Check tool permission
    this.app.post('/api/tools/permission', async (req, res) => {
      try {
        const { toolName, params } = req.body;

        if (!toolName) {
          return res.status(400).json({
            error: 'toolName is required'
          });
        }

        const tool = this.toolRegistry.getTool(toolName);
        if (!tool) {
          return res.status(404).json({
            error: `Tool '${toolName}' not found`
          });
        }

        const invocation = tool.build(params || {});
        const permission = await invocation.getDefaultPermission();

        res.json({
          toolName,
          permission
        });
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Allow tool for session
    this.app.post('/api/tools/allow', async (req, res) => {
      try {
        const { toolName } = req.body;
        // In a real implementation, this would update session permissions
        res.json({
          toolName,
          allowed: true
        });
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Deny tool for session
    this.app.post('/api/tools/deny', async (req, res) => {
      try {
        const { toolName } = req.body;
        // In a real implementation, this would update session permissions
        res.json({
          toolName,
          denied: true
        });
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Serve static files (webview)
    const webviewPath = join(__dirname, 'webview');
    if (fs.existsSync(webviewPath)) {
      this.app.use('/webview', express.static(webviewPath));
      this.app.use('/', express.static(webviewPath));
    }
  }

  /**
   * Start the server
   */
  async start() {
    if (!this.app) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Server listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Main execution
async function main() {
  const options = parseArgs();

  console.log('Starting Tool API Server...');
  console.log(`  Workspace: ${options.workspace}`);
  console.log(`  Port: ${options.port}`);

  try {
    const server = new ToolApiServer(options);
    await server.start();

    console.log('');
    console.log('Tool API Server is running!');
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  http://localhost:${options.port}/health          - Health check`);
    console.log(`  GET  http://localhost:${options.port}/api/tools       - Get all tools`);
    console.log(`  GET  http://localhost:${options.port}/api/tools/list  - List tools with descriptions`);
    console.log(`  POST http://localhost:${options.port}/api/tools/execute      - Execute a tool`);
    console.log(`  POST http://localhost:${options.port}/api/tools/execute-batch - Execute multiple tools`);
    console.log(`  POST http://localhost:${options.port}/api/tools/permission   - Check tool permission`);
    console.log('');
    console.log('Press Ctrl+C to stop the server.');

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start Tool API Server:', error);
    process.exit(1);
  }
}

// Export for programmatic usage
export { ToolApiServer };

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('tool-api-server')) {
  main();
}
