#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DeepSeek Chat CLI - Standalone Command Line Interface
 *
 * Launches the DeepSeek chat with Qwen Code tools in various modes:
 * - Terminal UI (interactive chat in terminal)
 * - Browser UI (opens web interface in default browser)
 * - API Server only (headless mode for IDE integration)
 *
 * Usage:
 *   npx qwen-deepseek chat              # Terminal UI
 *   npx qwen-deepseek ui                # Browser UI
 *   npx qwen-deepseek server            # API Server only
 *   npx qwen-deepseek ide               # IDE extension mode
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'chat';
const options = parseOptions(args.slice(1));

function parseOptions(args) {
  const opts = {
    port: 3456,
    workspace: process.cwd(),
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    open: true,
    host: '127.0.0.1'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        opts.port = parseInt(args[++i], 10);
        break;
      case '--workspace':
      case '-w':
        opts.workspace = args[++i];
        break;
      case '--api-key':
      case '-k':
        opts.apiKey = args[++i];
        break;
      case '--model':
      case '-m':
        opts.model = args[++i];
        break;
      case '--no-open':
        opts.open = false;
        break;
      case '--host':
        opts.host = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
DeepSeek Chat CLI - Qwen Code Tools

Usage:
  qwen-deepseek <command> [options]

Commands:
  chat      Terminal-based interactive chat (default)
  ui        Open web interface in browser
  server    Start API server only (headless)
  ide       IDE extension mode (auto-detect)

Options:
  -p, --port <number>       Port for API server (default: 3456)
  -w, --workspace <path>    Workspace directory (default: current dir)
  -k, --api-key <key>       DeepSeek API key (or set DEEPSEEK_API_KEY)
  -m, --model <name>        Model name (default: deepseek-chat)
  --no-open                 Don't open browser automatically
  --host <host>             Server host (default: 127.0.0.1)
  -h, --help                Show this help message

Examples:
  qwen-deepseek chat
  qwen-deepseek ui --port 8080
  qwen-deepseek server --workspace /my/project
  qwen-deepseek ide

Environment Variables:
  DEEPSEEK_API_KEY          Your DeepSeek API key
  QWEN_DEEPSEEK_PORT        Default port (overrides --port)
  QWEN_DEEPSEEK_WORKSPACE   Default workspace (overrides --workspace)
`);
}

// Check if port is available
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// Start the API server
async function startApiServer(options) {
  console.log('Starting DeepSeek Chat API Server...');
  console.log(`  Workspace: ${options.workspace}`);
  console.log(`  Port: ${options.port}`);
  console.log(`  Host: ${options.host}`);
  console.log();

  const serverScript = join(__dirname, 'tool-api-server.js');

  if (!fs.existsSync(serverScript)) {
    console.error(`Error: Server script not found at ${serverScript}`);
    process.exit(1);
  }

  const serverProcess = spawn('node', [serverScript, '--port', options.port.toString(), '--workspace', options.workspace], {
    stdio: 'inherit',
    shell: true
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return serverProcess;
}

// Terminal UI mode
async function runTerminalUI(options) {
  console.log('Starting Terminal UI...');
  console.log();

  await startApiServer(options);

  console.log();
  console.log('='.repeat(60));
  console.log('Terminal UI Mode');
  console.log('='.repeat(60));
  console.log();
  console.log('The API server is running. You can:');
  console.log();
  console.log('1. Open browser: http://localhost:' + options.port);
  console.log('2. Use the API directly:');
  console.log('   curl http://localhost:' + options.port + '/api/tools');
  console.log();
  console.log('Press Ctrl+C to stop the server.');
  console.log();
}

// Browser UI mode
async function runBrowserUI(options) {
  console.log('Starting Browser UI...');

  // Start API server
  await startApiServer(options);

  // Open browser
  if (options.open) {
    const url = `http://localhost:${options.port}`;
    console.log(`Opening browser: ${url}`);

    let openCommand;
    if (process.platform === 'win32') {
      openCommand = ['cmd', '/c', 'start', url];
    } else if (process.platform === 'darwin') {
      openCommand = ['open', url];
    } else {
      openCommand = ['xdg-open', url];
    }

    spawn(openCommand[0], openCommand.slice(1), { detached: true, stdio: 'ignore' });
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Browser UI Mode');
  console.log('='.repeat(60));
  console.log();
  console.log(`UI URL: http://localhost:${options.port}`);
  console.log();
  console.log('Press Ctrl+C to stop the server.');
  console.log();
}

// Server only mode
async function runServerOnly(options) {
  await startApiServer(options);

  console.log();
  console.log('='.repeat(60));
  console.log('Server Only Mode (Headless)');
  console.log('='.repeat(60));
  console.log();
  console.log('API Endpoints:');
  console.log(`  GET  http://localhost:${options.port}/health`);
  console.log(`  GET  http://localhost:${options.port}/api/tools`);
  console.log(`  POST http://localhost:${options.port}/api/tools/execute`);
  console.log();
  console.log('Press Ctrl+C to stop the server.');
  console.log();
}

// IDE extension mode
async function runIdeMode(options) {
  console.log('Starting IDE Extension Mode...');
  console.log();

  // Auto-detect IDE and start accordingly
  const ideInfo = detectIDE();

  if (ideInfo.detected) {
    console.log(`Detected IDE: ${ideInfo.name}`);
    console.log(`Workspace: ${ideInfo.workspace}`);
    if (ideInfo.workspace) {
      options.workspace = ideInfo.workspace;
    }
  } else {
    console.log('No IDE detected, running in standalone mode');
  }

  console.log();

  // Start API server for IDE integration
  await startApiServer(options);

  // Write lock file for IDE discovery
  const lockFile = join(getQwenDir(), 'deepseek-chat.lock');
  const lockData = {
    port: options.port,
    workspace: options.workspace,
    pid: process.pid,
    timestamp: Date.now()
  };

  try {
    fs.mkdirSync(dirname(lockFile), { recursive: true });
    fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
    console.log(`Lock file written: ${lockFile}`);
  } catch (error) {
    console.log(`Warning: Could not write lock file: ${error.message}`);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('IDE Extension Mode');
  console.log('='.repeat(60));
  console.log();
  console.log('The DeepSeek Chat server is running and available for IDE integration.');
  console.log();
  console.log(`API Server: http://localhost:${options.port}`);
  console.log(`Lock File: ${lockFile}`);
  console.log();
  console.log('IDEs can discover this server by reading the lock file.');
  console.log();
  console.log('Press Ctrl+C to stop the server.');
  console.log();
}

function detectIDE() {
  const result = {
    detected: false,
    name: null,
    workspace: null
  };

  // Check for VSCode
  if (process.env.VSCODE_INJECTION || process.env.VSCODE_GIT_IPC_HANDLE) {
    result.detected = true;
    result.name = 'VS Code';
    result.workspace = process.env.VSCODE_CWD || process.cwd();
    return result;
  }

  // Check for Cursor
  if (process.env.CURSOR_TRACE_ID || process.env.CURSOR_LOGS_DIR) {
    result.detected = true;
    result.name = 'Cursor';
    result.workspace = process.cwd();
    return result;
  }

  // Check for Windsurf
  if (process.env.WINDSURF_TRACE_ID) {
    result.detected = true;
    result.name = 'Windsurf';
    result.workspace = process.cwd();
    return result;
  }

  // Check for JetBrains IDEs
  if (process.env.JB_IDE_NAME || process.env.JB_PRODUCT_CODE) {
    result.detected = true;
    result.name = process.env.JB_IDE_NAME || 'JetBrains IDE';
    result.workspace = process.cwd();
    return result;
  }

  return result;
}

function getQwenDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
  if (!homeDir) {
    return join(process.env.APPDATA || process.cwd(), '.qwen');
  }
  return join(homeDir, '.qwen');
}

// Main execution
async function main() {
  // Override options from environment
  if (process.env.QWEN_DEEPSEEK_PORT) {
    options.port = parseInt(process.env.QWEN_DEEPSEEK_PORT, 10);
  }
  if (process.env.QWEN_DEEPSEEK_WORKSPACE) {
    options.workspace = process.env.QWEN_DEEPSEEK_WORKSPACE;
  }

  // Check API key
  if (!options.apiKey && command !== 'server') {
    console.warn('Warning: DEEPSEEK_API_KEY environment variable is not set.');
    console.warn('You will need to enter your API key in the UI settings.');
    console.warn();
  }

  // Check port availability
  const portAvailable = await isPortAvailable(options.port);
  if (!portAvailable) {
    console.error(`Error: Port ${options.port} is already in use.`);
    console.error('Use --port to specify a different port.');
    process.exit(1);
  }

  // Run appropriate mode
  switch (command) {
    case 'chat':
      await runTerminalUI(options);
      break;
    case 'ui':
      await runBrowserUI(options);
      break;
    case 'server':
      await runServerOnly(options);
      break;
    case 'ide':
      await runIdeMode(options);
      break;
    case 'help':
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use --help for usage information.');
      process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
