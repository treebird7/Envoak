
import { Command } from 'commander';
import fs from 'fs/promises';
import chalk from 'chalk';
import * as envManager from '../lib/env-manager.js';
import { runCheck } from './check.js'; // Reuse check logic

const ENV_FILE = '.env';
const ENC_FILE = 'config.enc';

export const pushCommand = (program: Command) => {
    program.command('push')
        .description('Validate and encrypt .env to config.enc')
        .option('-f, --file <path>', 'Path to .env file', ENV_FILE)
        .option('-o, --output <path>', 'Path to output encrypted file', ENC_FILE)
        .action(async (options) => {
            // 1. Check first
            const valid = await runCheck(options.file, false, true);
            if (!valid) {
                console.error(chalk.red('\n❌ Fix validation errors before encrypting.'));
                process.exit(1);
            }

            // 2. Get Key
            let key = process.env.ENVOAK_KEY || process.env.ENVOAK_KEY || process.env.ENVAULT_KEY;

            if (!key) {
                console.error(chalk.red('❌ ENVOAK_KEY not found.'));
                console.error(chalk.yellow('Run `envault init` to generate a key,'));
                console.error('or export ENVOAK_KEY=<key> manually.');
                process.exit(1);
            }

            // 3. Encrypt
            try {
                const content = await fs.readFile(options.file, 'utf-8');
                const encrypted = envManager.encryptEnv(content, key);
                await fs.writeFile(options.output, encrypted);
                console.log(chalk.green(`\n✅ Encrypted ${options.file} -> ${options.output}`));
                console.log(chalk.gray(`You can now safely commit ${options.output} to git.`));
            } catch (err: any) {
                console.error(chalk.red('Encryption failed:'), err.message);
                process.exit(1);
            }
        });
};
