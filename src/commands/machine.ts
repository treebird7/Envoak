import { Command } from 'commander';
import fs from 'fs/promises';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { randomUUID } from 'crypto';

// Machine config path
const ENVOAK_DIR = path.join(os.homedir(), '.envoak');
const MACHINE_FILE = path.join(ENVOAK_DIR, 'machine.json');

interface MachineConfig {
    id: string;
    name: string;
    hostname: string;
    sshFingerprint?: string;
    sshComment?: string;
    source: 'manual' | 'ssh' | 'auto';
    created: string;
    updated: string;
}

// Ensure ~/.envoak directory exists
function ensureEnvoakDir(): void {
    if (!existsSync(ENVOAK_DIR)) {
        mkdirSync(ENVOAK_DIR, { recursive: true });
    }
}

// Get SSH key info
function getSSHKeyInfo(): { fingerprint: string; comment: string } | null {
    const sshKeys = [
        path.join(os.homedir(), '.ssh', 'id_ed25519.pub'),
        path.join(os.homedir(), '.ssh', 'id_rsa.pub'),
    ];

    for (const keyPath of sshKeys) {
        if (existsSync(keyPath)) {
            try {
                const content = readFileSync(keyPath, 'utf-8').trim();
                const parts = content.split(' ');
                const comment = parts[2] || '';

                // Get fingerprint using ssh-keygen
                try {
                    const fingerprint = execSync(`ssh-keygen -lf ${keyPath}`, { encoding: 'utf-8' })
                        .split(' ')[1] || '';
                    return { fingerprint, comment };
                } catch {
                    return { fingerprint: '', comment };
                }
            } catch {
                continue;
            }
        }
    }
    return null;
}

// Parse machine name from SSH comment (e.g., "user@m2" -> "m2", "m2@treebird" -> "m2")
function parseMachineFromSSH(comment: string): string | null {
    if (!comment) return null;

    // Pattern: user@machine or machine@domain
    const atParts = comment.split('@');
    if (atParts.length >= 2) {
        // If format is machine@domain, return machine
        // If format is user@machine, return machine
        const candidate = atParts[atParts.length - 1];

        // Check if it looks like a machine name (not a domain)
        if (!candidate.includes('.')) {
            return candidate;
        }
        return atParts[0]; // user@machine.domain case
    }

    return comment; // Just use the whole comment
}

// Load current machine config
function loadMachine(): MachineConfig | null {
    if (existsSync(MACHINE_FILE)) {
        try {
            return JSON.parse(readFileSync(MACHINE_FILE, 'utf-8'));
        } catch {
            return null;
        }
    }
    return null;
}

// Save machine config
function saveMachine(config: MachineConfig): void {
    ensureEnvoakDir();
    writeFileSync(MACHINE_FILE, JSON.stringify(config, null, 2));
}

export const machineCommand = (program: Command) => {
    const machine = program
        .command('machine')
        .description('Manage machine identity for multi-machine development');

    // envoak machine set <name>
    machine
        .command('set <name>')
        .description('Set this machine\'s identity')
        .action(async (name: string) => {
            const sshInfo = getSSHKeyInfo();

            const config: MachineConfig = {
                id: randomUUID(),
                name: name,
                hostname: os.hostname(),
                sshFingerprint: sshInfo?.fingerprint,
                sshComment: sshInfo?.comment,
                source: 'manual',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            };

            saveMachine(config);

            console.log(chalk.green(`\n✅ Machine identity set to: ${chalk.bold(name)}`));
            console.log(chalk.gray(`   ID: ${config.id}`));
            console.log(chalk.gray(`   Hostname: ${config.hostname}`));
            if (sshInfo?.fingerprint) {
                console.log(chalk.gray(`   SSH Fingerprint: ${sshInfo.fingerprint}`));
            }

            console.log(chalk.yellow(`\n💡 Add to your .zshrc/.bashrc:`));
            console.log(chalk.bgBlack.white(`   export TREEBIRD_MACHINE="${name}"`));
        });

    // envoak machine get
    machine
        .command('get')
        .description('Get current machine identity')
        .action(async () => {
            const config = loadMachine();

            if (!config) {
                console.log(chalk.yellow('\n⚠️  No machine identity configured.'));
                console.log(chalk.gray('   Run: envoak machine detect'));
                console.log(chalk.gray('   Or:  envoak machine set <name>'));
                process.exit(1);
            }

            console.log(chalk.green(`\n🖥️  Machine: ${chalk.bold(config.name)}`));
            console.log(chalk.gray(`   ID: ${config.id}`));
            console.log(chalk.gray(`   Hostname: ${config.hostname}`));
            console.log(chalk.gray(`   Source: ${config.source}`));
            if (config.sshFingerprint) {
                console.log(chalk.gray(`   SSH: ${config.sshFingerprint}`));
            }
            console.log(chalk.gray(`   Created: ${config.created}`));
        });

    // envoak machine detect
    machine
        .command('detect')
        .description('Auto-detect machine identity from SSH key')
        .option('--save', 'Save detected identity')
        .action(async (options) => {
            const sshInfo = getSSHKeyInfo();

            if (!sshInfo) {
                console.log(chalk.red('\n❌ No SSH key found in ~/.ssh/'));
                console.log(chalk.gray('   Create one with: ssh-keygen -t ed25519 -C "yourname@m2"'));
                process.exit(1);
            }

            console.log(chalk.blue('\n🔍 SSH Key Info:'));
            console.log(chalk.gray(`   Comment: ${sshInfo.comment || '(none)'}`));
            console.log(chalk.gray(`   Fingerprint: ${sshInfo.fingerprint}`));

            const detectedName = parseMachineFromSSH(sshInfo.comment);

            if (detectedName) {
                console.log(chalk.green(`\n✅ Detected machine name: ${chalk.bold(detectedName)}`));

                if (options.save) {
                    const config: MachineConfig = {
                        id: randomUUID(),
                        name: detectedName,
                        hostname: os.hostname(),
                        sshFingerprint: sshInfo.fingerprint,
                        sshComment: sshInfo.comment,
                        source: 'ssh',
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                    };
                    saveMachine(config);
                    console.log(chalk.green(`   Saved to ${MACHINE_FILE}`));
                } else {
                    console.log(chalk.yellow('\n💡 To save this identity, run:'));
                    console.log(chalk.gray('   envoak machine detect --save'));
                }
            } else {
                console.log(chalk.yellow('\n⚠️  Could not detect machine name from SSH comment.'));
                console.log(chalk.gray('   Regenerate key with: ssh-keygen -t ed25519 -C "yourname@m2"'));
                console.log(chalk.gray('   Or set manually: envoak machine set m2'));
            }
        });

    // envoak machine export
    machine
        .command('export')
        .description('Output shell export command for TREEBIRD_MACHINE')
        .action(async () => {
            const config = loadMachine();

            if (!config) {
                console.error('No machine identity configured');
                process.exit(1);
            }

            // Output just the export command (for eval)
            console.log(`export TREEBIRD_MACHINE="${config.name}"`);
        });

    // envoak machine env
    machine
        .command('env')
        .description('Output just the machine name (for scripting)')
        .action(async () => {
            const config = loadMachine();
            if (config) {
                console.log(config.name);
            } else {
                console.log('unknown');
            }
        });
};
