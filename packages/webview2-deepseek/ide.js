/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IDE Extension Launcher
 *
 * This module provides auto-start functionality for IDE integrations.
 * It can be imported by VSCode, JetBrains, or other IDE extensions
 * to automatically start the DeepSeek Chat server.
 *
 * Usage in IDE extension:
 *
 *   // VSCode extension example
 *   import { DeepSeekChatIDE } from '@qwen-code/webview2-deepseek/ide';
 *
 *   export async function activate(context) {
 *     const chat = new DeepSeekChatIDE(context);
 *     await chat.start();
 *
 *     // Get server info for webview
 *     const info = chat.getServerInfo();
 *     console.log(`DeepSeek Chat running on port ${info.port}`);
 *   }
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DeepSeek Chat IDE Integration Class
 */
export class DeepSeekChatIDE {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3456,
      workspace: options.workspace || process.cwd(),
      host: options.host || '127.0.0.1',
      autoStart: options.autoStart !== false,
      lockFilePath: options.lockFilePath,
      ...options
    };

    this.serverProcess = null;
    this.serverInfo = null;
    this.isRunning = false;
    this.context = options.context; // IDE context (VSCode, etc.)
  }

  /**
   * Start the DeepSeek Chat server
   */
  async start() {
    if (this.isRunning) {
      return this.serverInfo;
    }

    console.log('[DeepSeekChatIDE] Starting server...');

    // Check if port is available
    const portAvailable = await this.isPortAvailable(this.options.port);

    if (!portAvailable) {
      // Try to find an available port
      this.options.port = await this.findAvailablePort(this.options.port);
    }

    // Start server process
    await this.startServerProcess();

    // Wait for server to be ready
    await this.waitForServerReady();

    // Write lock file for IDE discovery
    await this.writeLockFile();

    this.isRunning = true;
    console.log(`[DeepSeekChatIDE] Server started on port ${this.options.port}`);

    return this.getServerInfo();
  }

  /**
   * Stop the DeepSeek Chat server
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[DeepSeekChatIDE] Stopping server...');

    // Remove lock file
    await this.removeLockFile();

    // Kill server process
    if (this.serverProcess) {
      try {
        // Windows: kill entire process tree
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', this.serverProcess.pid.toString(), '/f', '/t']);
        } else {
          this.serverProcess.kill('SIGTERM');
        }
      } catch (error) {
        console.error('[DeepSeekChatIDE] Error stopping server:', error.message);
      }
      this.serverProcess = null;
    }

    this.isRunning = false;
    this.serverInfo = null;
  }

  /**
   * Get server connection information
   */
  getServerInfo() {
    return {
      port: this.options.port,
      host: this.options.host,
      url: `http://${this.options.host}:${this.options.port}`,
      workspace: this.options.workspace,
      pid: this.serverProcess?.pid,
      lockFile: this.getLockFilePath()
    };
  }

  /**
   * Get the WebView2 URL for embedding in IDE
   */
  getWebViewUrl() {
    const info = this.getServerInfo();
    return `${info.url}/webview`;
  }

  /**
   * Start the server process
   */
  async startServerProcess() {
    const serverScript = path.join(__dirname, 'tool-api-server.js');

    if (!fs.existsSync(serverScript)) {
      throw new Error(`Server script not found: ${serverScript}`);
    }

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', [serverScript, '--port', this.options.port.toString(), '--workspace', this.options.workspace], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });

      this.serverProcess.stdout.on('data', (data) => {
        console.log(`[DeepSeekChat] ${data.toString().trim()}`);
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[DeepSeekChat Error] ${data.toString().trim()}`);
      });

      this.serverProcess.on('error', (error) => {
        console.error('[DeepSeekChatIDE] Server process error:', error.message);
        reject(error);
      });

      this.serverProcess.on('exit', (code) => {
        console.log(`[DeepSeekChatIDE] Server exited with code ${code}`);
        this.isRunning = false;
      });

      // Resolve after a short delay to let server start
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Wait for server to be ready
   */
  async waitForServerReady(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.httpGet(`http://${this.options.host}:${this.options.port}/health`);
        if (response.status === 200) {
          this.serverInfo = {
            port: this.options.port,
            host: this.options.host,
            ...response.data
          };
          return;
        }
      } catch {
        // Server not ready yet
      }
      await this.sleep(200);
    }
    throw new Error('Server failed to start within timeout');
  }

  /**
   * Write lock file for IDE discovery
   */
  async writeLockFile() {
    const lockFile = this.getLockFilePath();
    const lockData = {
      port: this.options.port,
      host: this.options.host,
      workspace: this.options.workspace,
      pid: this.serverProcess?.pid,
      timestamp: Date.now(),
      type: 'deepseek-chat'
    };

    try {
      const lockDir = path.dirname(lockFile);
      fs.mkdirSync(lockDir, { recursive: true });
      fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
      console.log(`[DeepSeekChatIDE] Lock file: ${lockFile}`);
    } catch (error) {
      console.error('[DeepSeekChatIDE] Failed to write lock file:', error.message);
    }
  }

  /**
   * Remove lock file
   */
  async removeLockFile() {
    const lockFile = this.getLockFilePath();
    try {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
    } catch (error) {
      console.error('[DeepSeekChatIDE] Failed to remove lock file:', error.message);
    }
  }

  /**
   * Get lock file path
   */
  getLockFilePath() {
    if (this.options.lockFilePath) {
      return this.options.lockFilePath;
    }

    const homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
    const baseDir = homeDir ? path.join(homeDir, '.qwen') : path.join(process.env.APPDATA || process.cwd(), '.qwen');
    return path.join(baseDir, 'ide', `deepseek-chat-${this.options.port}.lock`);
  }

  /**
   * Check if port is available
   */
  isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.listen(port, this.options.host, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  }

  /**
   * Find available port starting from given port
   */
  async findAvailablePort(startPort) {
    for (let port = startPort; port < startPort + 100; port++) {
      if (await this.isPortAvailable(port)) {
        console.log(`[DeepSeekChatIDE] Using alternative port ${port}`);
        return port;
      }
    }
    throw new Error('No available ports found');
  }

  /**
   * Simple HTTP GET
   */
  httpGet(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Auto-start DeepSeek Chat for IDE integration
 *
 * This function can be called from an IDE extension to automatically
 * start the DeepSeek Chat server and return connection info.
 *
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Server info with port, url, etc.
 */
export async function autoStart(options = {}) {
  const chat = new DeepSeekChatIDE(options);
  await chat.start();
  return chat.getServerInfo();
}

/**
 * Get existing server info from lock file
 *
 * This function discovers an already-running DeepSeek Chat server
 * by reading the lock file.
 *
 * @returns {Object|null} Server info or null if not running
 */
export function getExistingServer() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
  const ideDir = homeDir ? path.join(homeDir, '.qwen', 'ide') : path.join(process.env.APPDATA || process.cwd(), '.qwen', 'ide');

  if (!fs.existsSync(ideDir)) {
    return null;
  }

  // Find lock files
  const files = fs.readdirSync(ideDir);
  for (const file of files) {
    if (file.includes('deepseek-chat') && file.endsWith('.lock')) {
      try {
        const lockData = JSON.parse(fs.readFileSync(path.join(ideDir, file), 'utf-8'));

        // Check if process is still running
        try {
          process.kill(lockData.pid, 0);
        } catch {
          // Process not running, skip
          continue;
        }

        return {
          port: lockData.port,
          host: lockData.host || '127.0.0.1',
          workspace: lockData.workspace,
          pid: lockData.pid,
          url: `http://${lockData.host || '127.0.0.1'}:${lockData.port}`
        };
      } catch {
        // Invalid lock file, skip
      }
    }
  }

  return null;
}

/**
 * Check if DeepSeek Chat server is running
 *
 * @returns {boolean} True if server is running
 */
export function isRunning() {
  return getExistingServer() !== null;
}

// Export for IDE extension usage
export default {
  DeepSeekChatIDE,
  autoStart,
  getExistingServer,
  isRunning
};
