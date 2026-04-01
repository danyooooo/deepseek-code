/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import type { Server } from 'http';
import type { ToolRegistry } from '@qwen-code/qwen-code-core';
import { ToolBridge } from './ToolBridge.js';
import type { ToolExecutionResult } from './ToolBridge.js';

/**
 * HTTP API server for exposing Qwen Code tools to WebView2
 */
export class ToolApiServer {
  private app: express.Application;
  private server: Server | null = null;
  private toolBridge: ToolBridge;
  private port: number;

  constructor(options: {
    toolRegistry: ToolRegistry;
    port?: number;
  }) {
    this.app = express();
    this.port = options.port ?? 3456;
    this.toolBridge = new ToolBridge(options.toolRegistry);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get all available tools
    this.app.get('/api/tools', (_req, res) => {
      try {
        const tools = this.toolBridge.getToolsForDeepSeek();
        res.json({ tools });
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to get tools' 
        });
      }
    });

    // Get tool list with descriptions
    this.app.get('/api/tools/list', (_req, res) => {
      try {
        const tools = this.toolBridge.getAllToolDescriptions();
        res.json({ tools });
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to list tools' 
        });
      }
    });

    // Execute a single tool
    this.app.post('/api/tools/execute', async (req, res) => {
      try {
        const { toolName, params } = req.body;

        if (!toolName) {
          return res.status(400).json({ error: 'toolName is required' });
        }

        if (!params || typeof params !== 'object') {
          return res.status(400).json({ error: 'params must be an object' });
        }

        const result: ToolExecutionResult = await this.toolBridge.executeTool(toolName, params);

        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Tool execution failed' 
        });
      }
    });

    // Execute multiple tools
    this.app.post('/api/tools/execute-batch', async (req, res) => {
      try {
        const { toolCalls } = req.body;

        if (!Array.isArray(toolCalls)) {
          return res.status(400).json({ error: 'toolCalls must be an array' });
        }

        const results = await this.toolBridge.executeTools(
          toolCalls.map((call: { toolName: string; params: Record<string, unknown> }) => ({
            toolName: call.toolName,
            params: call.params
          }))
        );

        res.json({ results });
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Batch execution failed' 
        });
      }
    });

    // Check tool permission
    this.app.post('/api/tools/permission', async (req, res) => {
      try {
        const { toolName, params } = req.body;

        if (!toolName) {
          return res.status(400).json({ error: 'toolName is required' });
        }

        const permission = await this.toolBridge.getDefaultPermission(
          toolName, 
          params ?? {}
        );

        res.json({ toolName, permission });
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Permission check failed' 
        });
      }
    });

    // Allow tool for session
    this.app.post('/api/tools/allow', (req, res) => {
      try {
        const { toolName } = req.body;
        this.toolBridge.allowTool(toolName);
        res.json({ success: true, toolName });
      } catch (error) {
        res.status(400).json({ 
          error: error instanceof Error ? error.message : 'Invalid tool name' 
        });
      }
    });

    // Deny tool for session
    this.app.post('/api/tools/deny', (req, res) => {
      try {
        const { toolName } = req.body;
        this.toolBridge.denyTool(toolName);
        res.json({ success: true, toolName });
      } catch (error) {
        res.status(400).json({ 
          error: error instanceof Error ? error.message : 'Invalid tool name' 
        });
      }
    });
  }

  /**
   * Start the API server
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, '127.0.0.1', () => {
        const address = this.server!.address();
        const actualPort = typeof address === 'string' ? parseInt(address.split(':').pop() || '0') : address?.port || this.port;
        console.log(`Tool API server running on http://127.0.0.1:${actualPort}`);
        resolve(actualPort);
      });

      this.server.on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server!.close((error) => {
          if (error) {
            reject(error);
          } else {
            console.log('Tool API server stopped');
            resolve();
          }
        });
      });
    }
  }

  /**
   * Get the current port
   */
  getPort(): number {
    return this.port;
  }
}
