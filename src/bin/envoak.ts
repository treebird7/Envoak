#!/usr/bin/env node
/**
 * Envoak — Encrypted Git-Ops for Environment Variables
 */

import 'dotenv/config'; // Load .env if present (mostly for ENVOAK_KEY)
import { Command } from 'commander';
import { checkCommand } from '../commands/check.js';
import { pushCommand } from '../commands/push.js';
import { pullCommand } from '../commands/pull.js';
import { auditCommand } from '../commands/audit.js';
import { initCommand } from '../commands/init.js';
import { fileCommand } from '../commands/file.js';
import { mcpCommand } from '../commands/mcp.js';
import { keysCommand } from '../commands/keys.js';
import { scanCommand } from '../commands/scan.js';
import { statusCommand } from '../commands/status.js';

const program = new Command();

program
    .name('envoak')
    .description('🌳 Encrypted Git-Ops for your environment variables')
    .version('0.2.0');

// Register Commands
checkCommand(program);
pushCommand(program);
pullCommand(program);
auditCommand(program);
initCommand(program);
fileCommand(program);
mcpCommand(program);
keysCommand(program);
scanCommand(program);
statusCommand(program);

program.parse();
