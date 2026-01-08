import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';

export const scanCommand = (program: Command) => {
    program.command('scan <subcommand> [args...]')
        .description('Run an Envault command in all subdirectories containing .env')
        .allowUnknownOption()
        .action(async (subcommand, args) => {
            const rootDir = process.cwd();
            console.log(chalk.bold(`\n🔍 Scanning subdirectories in ${rootDir} for .env files...\n`));

            let dirs: string[];
            try {
                const entries = await fs.readdir(rootDir, { withFileTypes: true });
                dirs = entries
                    .filter(e => e.isDirectory())
                    .map(e => e.name);
            } catch (err: any) {
                console.error(chalk.red('Failed to read directory:'), err.message);
                process.exit(1);
            }

            const targets: string[] = [];

            // Filter for managed directories
            // managed = has .env OR .envault_key (if initializing)
            for (const dir of dirs) {
                const fullPath = path.join(rootDir, dir);
                try {
                    // Check for .env or .envault_key
                    const files = await fs.readdir(fullPath);
                    if (files.includes('.env') || files.includes('.envault_key') || files.includes('config.enc')) {
                        targets.push(dir);
                    }
                } catch {
                    // Ignore access errors
                }
            }

            if (targets.length === 0) {
                console.log(chalk.yellow('No managed subdirectories found (dirs with .env, .envault_key, or config.enc).'));
                return;
            }

            console.log(chalk.blue(`Found ${targets.length} targets: ${targets.join(', ')}\n`));

            // Try to load root .env manually to ensure we have the latest keys
            // (Envault binary loads dotenv at startup, but explicit loading is safer for dynamic changes)
            let globalEnvKey = process.env.ENVAULT_KEY;
            try {
                const rootEnvPath = path.join(rootDir, '.env');
                const rootEnvContent = await fs.readFile(rootEnvPath, 'utf-8');
                // Simple parse for ENVAULT_KEY if not already in process.env
                if (!globalEnvKey) {
                    const match = rootEnvContent.match(/^ENVAULT_KEY=(.+)$/m);
                    if (match) {
                        globalEnvKey = match[1].trim();
                        // Remove quotes if present
                        if ((globalEnvKey.startsWith('"') && globalEnvKey.endsWith('"')) ||
                            (globalEnvKey.startsWith("'") && globalEnvKey.endsWith("'"))) {
                            globalEnvKey = globalEnvKey.slice(1, -1);
                        }
                    }
                }
            } catch {
                // No root .env or read error
            }

            if (globalEnvKey) {
                console.log(chalk.blue(`ℹ️  Using global ENVAULT_KEY from ${rootDir}\n`));
            } else {
                console.log(chalk.yellow(`ℹ️  No global ENVAULT_KEY found in ${rootDir}. Expecting local keys in subdirectories.\n`));
            }

            let failures = 0;

            for (const dir of targets) {
                console.log(chalk.bgBlue.white.bold(` 📂 ${dir} `) + chalk.gray(` (Running ${subcommand})...`));

                const fullPath = path.join(rootDir, dir);

                await new Promise<void>((resolve) => {
                    const envVars: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: '1' };
                    if (globalEnvKey) {
                        envVars.ENVAULT_KEY = globalEnvKey;
                    }

                    const child = spawn(
                        process.execPath, // node
                        [process.argv[1], subcommand, ...args], // envault <cmd> [args]
                        {
                            cwd: fullPath,
                            stdio: 'inherit',
                            env: envVars
                        }
                    );

                    child.on('close', (code) => {
                        if (code !== 0) {
                            console.log(chalk.red(`\n❌ Command failed in ${dir} (exit code ${code})\n`));
                            failures++;
                        } else {
                            console.log(chalk.green(`\n✅ Success in ${dir}\n`));
                        }
                        resolve();
                    });

                    child.on('error', (err) => {
                        console.error(chalk.red(`Failed to start process:`), err.message);
                        failures++;
                        resolve();
                    });
                });
            }

            if (failures > 0) {
                console.log(chalk.red(`Scan completed with ${failures} failures.`));
                process.exit(1);
            } else {
                console.log(chalk.green('✨ Scan completed successfully on all targets.'));
            }
        });
};
