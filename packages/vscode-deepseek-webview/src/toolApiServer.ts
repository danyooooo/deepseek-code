/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as http from 'http';
import express from 'express';
import cors from 'cors';
import { ToolBridge } from './toolBridge';

/**
 * Tool API Server Configuration
 */
export interface ToolApiServerOptions {
  toolBridge: ToolBridge;
  port: number;
  workspace: string;
}

/**
 * Tool API Server
 * 
 * HTTP server that exposes Qwen Code tools via REST API
 * Used by DeepSeek webview to execute tools
 */
export class ToolApiServer {
  private app: express.Application;
  private server: http.Server | undefined;
  private toolBridge: ToolBridge;
  public port: number;
  public workspace: string;
  private running: boolean = false;

  constructor(options: ToolApiServerOptions) {
    this.app = express();
    this.toolBridge = options.toolBridge;
    this.port = options.port;
    this.workspace = options.workspace;

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /**
   * Setup API routes
   */
  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        port: this.port,
        workspace: this.workspace,
        timestamp: new Date().toISOString()
      });
    });

    // Get available tools
    this.app.get('/api/tools', (req, res) => {
      try {
        const tools = this.toolBridge.getAvailableTools();
        res.json({
          tools,
          count: tools.length
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Execute a tool
    this.app.post('/api/tools/execute', async (req, res) => {
      try {
        const { toolName, params } = req.body;

        if (!toolName) {
          return res.status(400).json({
            error: 'toolName is required'
          });
        }

        const result = await this.toolBridge.executeTool(toolName, params || {});

        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Execute multiple tools (batch)
    this.app.post('/api/tools/execute-batch', async (req, res) => {
      try {
        const { toolCalls } = req.body;

        if (!Array.isArray(toolCalls)) {
          return res.status(400).json({
            error: 'toolCalls must be an array'
          });
        }

        const results = await Promise.all(
          toolCalls.map(async (call: any) => {
            try {
              const { toolName, params } = call;
              return {
                toolName,
                ...(await this.toolBridge.executeTool(toolName, params || {}))
              };
            } catch (error) {
              return {
                toolName: call.toolName,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
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
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, '127.0.0.1', () => {
        this.running = true;
        console.log(`[ToolApiServer] Listening on http://localhost:${this.port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        this.running = false;
        reject(error);
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((error) => {
          this.running = false;
          this.server = undefined;
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if server is running
   */
  get isRunning(): boolean {
    return this.running;
  }
}
