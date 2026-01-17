import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { validateEnv, validateKey } from '../lib/env-manager.js';

export function statusCommand(program: Command) {
    program
        .command('status')
        .description('Show current directory encryption status at a glance')
        .option('-v, --verbose', 'Show detailed information')
        .action(async (options) => {
            const cwd = process.cwd();
            const envPath = path.join(cwd, '.env');
            const encPath = path.join(cwd, 'config.enc');

            console.log('');
            console.log(chalk.bold('🌳 Envoak Status'));
            console.log(chalk.dim('─'.repeat(40)));

            // Check .env
            let envExists = false;
            let envValid = true;
            let envSize = 0;
            try {
                const stat = await fs.stat(envPath);
                envExists = true;
                envSize = stat.size;
                const content = await fs.readFile(envPath, 'utf-8');
                const check = validateEnv(content);
                envValid = check.valid;
            } catch { }

            // Check config.enc
            let encExists = false;
            let encSize = 0;
            let encMtime: Date | null = null;
            try {
                const stat = await fs.stat(encPath);
                encExists = true;
                encSize = stat.size;
                encMtime = stat.mtime;
            } catch { }

            // Check key
            const keyLoaded = !!process.env.ENVOAK_KEY && validateKey(process.env.ENVOAK_KEY);

            // Determine status
            let status = 'NONE';
            let statusColor = chalk.gray;
            let statusIcon = '○';

            if (encExists && !envExists) {
                status = 'MISSING';
                statusColor = chalk.yellow;
                statusIcon = '⚠';
            } else if (envExists && !encExists) {
                status = 'UNTRACKED';
                statusColor = chalk.red;
                statusIcon = '✗';
            } else if (envExists && encExists) {
                status = 'SYNCED';
                statusColor = chalk.green;
                statusIcon = '✓';
            }

            // Display
            console.log(`├── .env:       ${envExists
                ? chalk.green('✓ exists') + (envValid ? '' : chalk.yellow(' (invalid format)'))
                : chalk.dim('○ not found')}`);

            console.log(`├── config.enc: ${encExists
                ? chalk.green('✓ exists') + chalk.dim(` (${formatBytes(encSize)})`)
                : chalk.dim('○ not found')}`);

            console.log(`├── ENVOAK_KEY: ${keyLoaded
                ? chalk.green('✓ loaded')
                : chalk.yellow('○ not set')}`);

            console.log(`└── Status:     ${statusColor(`${statusIcon} ${status}`)}`);

            // Suggestions
            console.log('');
            if (!keyLoaded) {
                console.log(chalk.dim('💡 Run `envoak init` to generate a key'));
            } else if (status === 'UNTRACKED') {
                console.log(chalk.dim('💡 Run `envoak push` to encrypt your .env'));
            } else if (status === 'MISSING') {
                console.log(chalk.dim('💡 Run `envoak pull` to restore from backup'));
            } else if (status === 'SYNCED') {
                console.log(chalk.dim('✨ All good! Your secrets are backed up.'));
            }

            if (options.verbose && encMtime) {
                console.log('');
                console.log(chalk.dim(`Last encrypted: ${encMtime.toLocaleString()}`));
            }

            console.log('');
        });
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
