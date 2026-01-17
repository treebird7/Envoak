
import { Command } from 'commander';
import fs from 'fs/promises';
import chalk from 'chalk';
import * as envManager from '../lib/env-manager.js';

export const initCommand = (program: Command) => {
    program.command('init')
        .description('Initialize Envault: generate key and setup .gitignore')
        .action(async () => {
            const key = envManager.generateKey();

            console.log(chalk.green('\n🔑 Generated new ENVOAK_KEY'));
            console.log(chalk.bgBlack.white.bold(` ${key} `));
            console.log(chalk.yellow('\n👉 Add this to your local .env or secret manager!'));
            console.log(chalk.gray('ENVOAK_KEY=' + key));

            // Check gitignore
            try {
                const gitignorePath = '.gitignore';
                await fs.access(gitignorePath);
                const content = await fs.readFile(gitignorePath, 'utf-8');

                const needsIgnore = [];
                if (!content.includes('.env')) needsIgnore.push('.env');
                if (!content.includes('.env.bak')) needsIgnore.push('.env.bak');

                if (needsIgnore.length > 0) {
                    console.log(chalk.blue(`\n💡 Tip: Add these to your .gitignore:`));
                    needsIgnore.forEach(f => console.log(`   ${f}`));
                } else {
                    console.log(chalk.green('\n✅ .gitignore is correctly configured (ignores .env, .env.bak).'));
                }

            } catch {
                console.log(chalk.yellow('\n⚠️  No .gitignore found. Make sure to ignore .env files!'));
            }
        });
};
