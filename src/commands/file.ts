
import { Command } from 'commander';
import fs from 'fs/promises';
import chalk from 'chalk';
import * as envManager from '../lib/env-manager.js';

export const fileCommand = (program: Command) => {
    const file = program.command('file')
        .description('🗄️  Encrypt/Decrypt arbitrary files');

    file.command('push <path> [outputPath]')
        .description('Encrypt a file to <path>.enc')
        .action(async (filePath, outputArg) => {
            const key = process.env.ENVOAK_KEY || process.env.ENVAULT_KEY;
            if (!key) {
                console.error(chalk.red('❌ ENVOAK_KEY not found.'));
                process.exit(1);
            }

            try {
                const content = await fs.readFile(filePath, 'utf-8'); // TODO: Support binary? Current implementation assumes utf8 for wrapper
                // Re-using encryptEnv for now, which handles UTF8 strings. 
                // For true binary support we might need a separate binary-capable encryptor, 
                // but for text keys (PEM, JSON, YAML) this is fine.
                const encrypted = envManager.encryptEnv(content, key);

                const outputPath = outputArg || filePath + '.enc';
                await fs.writeFile(outputPath, encrypted);
                console.log(chalk.green(`\n✅ Encrypted ${filePath} -> ${outputPath}`));
            } catch (err: any) {
                console.error(chalk.red('Encryption failed:'), err.message);
                process.exit(1);
            }
        });

    file.command('pull <path> [outputPath]')
        .description('Decrypt a file (expects <path>.enc by default or explicit input)')
        .option('-i, --input <inputPath>', 'Input encrypted file')
        .action(async (pathArg, outputArg, options) => {
            const key = process.env.ENVOAK_KEY || process.env.ENVAULT_KEY;
            if (!key) {
                console.error(chalk.red('❌ ENVOAK_KEY not found.'));
                process.exit(1);
            }

            // Determine input/output
            // Usage 1: envault file pull file.enc output.txt
            // Usage 2: envault file pull file (looks for file.enc -> file)

            let inputPath = options.input;
            let outputPath = outputArg;

            if (!inputPath) {
                // Determine input from first arg
                if (pathArg.endsWith('.enc')) {
                    inputPath = pathArg;
                    // Auto-determine output if not provided
                    if (!outputPath) {
                        outputPath = pathArg.slice(0, -4);
                    }
                } else {
                    // Assume input is pathArg + .enc
                    inputPath = pathArg + '.enc';
                    // Auto-determine output if not provided
                    if (!outputPath) {
                        outputPath = pathArg;
                    }
                }
            } else {
                // Input provided via flag, use pathArg as output if outputArg not present?
                // Or if input flag is used, pathArg IS the output? 
                // Let's keep it simple: if -i is used, pathArg is output.
                if (!outputPath) outputPath = pathArg;
            }

            if (!inputPath || !outputPath) {
                console.error(chalk.red('Could not determine input/output paths.'));
                console.error('Usage: envault file pull <file> (decrypts <file>.enc -> <file>)');
                process.exit(1);
            }

            try {
                const encrypted = await fs.readFile(inputPath, 'utf-8');
                const decrypted = envManager.decryptEnv(encrypted, key);

                await fs.writeFile(outputPath, decrypted);
                console.log(chalk.green(`\n✅ Decrypted ${inputPath} -> ${outputPath}`));
            } catch (err: any) {
                console.error(chalk.red('Decryption failed:'), err.message);
                process.exit(1);
            }
        });
};
