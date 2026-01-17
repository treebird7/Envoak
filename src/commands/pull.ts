
import { Command } from 'commander';
import fs from 'fs/promises';
import chalk from 'chalk';
import * as envManager from '../lib/env-manager.js';

const ENV_FILE = '.env';
const ENC_FILE = 'config.enc';

export const pullCommand = (program: Command) => {
    program.command('pull')
        .description('Decrypt config.enc to .env')
        .option('-f, --file <path>', 'Path to encrypted file', ENC_FILE)
        .option('-o, --output <path>', 'Path to output .env file', ENV_FILE)
        .option('--force', 'Overwrite existing .env file without warning')
        .action(async (options) => {
            const key = process.env.ENVOAK_KEY || process.env.ENVAULT_KEY;
            if (!key) {
                console.error(chalk.red('❌ ENVOAK_KEY not found.'));
                console.error('Please export ENVOAK_KEY=<your-key> and try again.');
                process.exit(1);
            }

            try {
                const encrypted = await fs.readFile(options.file, 'utf-8');
                const decrypted = envManager.decryptEnv(encrypted, key);

                if (!options.force) {
                    try {
                        await fs.access(options.output);
                        console.log(chalk.yellow(`⚠️  ${options.output} already exists.`));
                        console.log(chalk.gray('Overwriting existing file... (Use --force to suppress this)'));
                    } catch { }
                }

                await fs.writeFile(options.output, decrypted);
                console.log(chalk.green(`\n✅ Decrypted ${options.file} -> ${options.output}`));
            } catch (err: any) {
                console.error(chalk.red('Decryption failed:'), err.message);
                process.exit(1);
            }
        });
};
