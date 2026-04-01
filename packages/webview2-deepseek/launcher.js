#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unified Launcher for DeepSeek Chat
 *
 * This script provides a unified entry point that auto-detects
 * the execution environment and starts the appropriate mode:
 *
 * - IDE Extension: When imported by VSCode/JetBrains extension
 * - CLI: When run from command line
 * - Module: When imported as Node.js module
 *
 * Usage:
 *
 *   // Auto-detect and start
 *   node launcher.js
 *
 *   // Force specific mode
 *   node launcher.js --mode cli
 *   node launcher.js --mode ide
 *   node launcher.js --mode server
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1];

// Detect execution environment
const env = detectEnvironment();

console.log('DeepSeek Chat Launcher');
console.log('='.repeat(50));
console.log(`Environment: ${env.name}`);
console.log(`Mode: ${modeArg || env.defaultMode}`);
console.log();

// Start appropriate mode
const mode = modeArg || env.defaultMode;

switch (mode) {
  case 'cli':
    startCLI();
    break;
  case 'ide':
    startIDE();
    break;
  case 'server':
    startServer();
    break;
  case 'ui':
    startUI();
    break;
  default:
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
}

/**
 * Detect execution environment
 */
function detectEnvironment() {
  // VSCode extension
  if (process.env.VSCODE_INJECTION || process.env.VSCODE_GIT_IPC_HANDLE) {
    return {
      name: 'VSCode Extension',
      defaultMode: 'ide'
    };
  }

  // Cursor IDE
  if (process.env.CURSOR_TRACE_ID) {
    return {
      name: 'Cursor',
      defaultMode: 'ide'
    };
  }

  // Windsurf
  if (process.env.WINDSURF_TRACE_ID) {
    return {
      name: 'Windsurf',
      defaultMode: 'ide'
    };
  }

  // JetBrains IDE
  if (process.env.JB_IDE_NAME || process.env.JB_PRODUCT_CODE) {
    return {
      name: 'JetBrains IDE',
      defaultMode: 'ide'
    };
  }

  // Check if running as npm script
  if (process.env.npm_lifecycle_script) {
    return {
      name: 'NPM Script',
      defaultMode: 'cli'
    };
  }

  // Default to CLI
  return {
    name: 'Command Line',
    defaultMode: 'cli'
  };
}

/**
 * Start CLI mode
 */
function startCLI() {
  const cliScript = join(__dirname, 'cli.js');
  spawnProcess('node', [cliScript, 'chat', ...args]);
}

/**
 * Start UI mode (browser)
 */
function startUI() {
  const cliScript = join(__dirname, 'cli.js');
  spawnProcess('node', [cliScript, 'ui', ...args]);
}

/**
 * Start IDE mode
 */
function startIDE() {
  const cliScript = join(__dirname, 'cli.js');
  spawnProcess('node', [cliScript, 'ide', ...args]);
}

/**
 * Start server-only mode
 */
function startServer() {
  const cliScript = join(__dirname, 'cli.js');
  spawnProcess('node', [cliScript, 'server', ...args]);
}

/**
 * Spawn a child process
 */
function spawnProcess(command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error(`Failed to start: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
