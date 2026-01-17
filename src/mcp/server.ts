
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import * as envManager from "../lib/env-manager.js";


/**
 * Validate that a path is within the current working directory.
 * Prevents path traversal attacks via MCP tools.
 */
function validatePathWithinCwd(filePath: string): string {
    const cwd = process.cwd();
    const fullPath = path.resolve(filePath);
    if (!fullPath.startsWith(cwd + path.sep) && fullPath !== cwd) {
        throw new Error(`Security: Path must be within current directory (${cwd})`);
    }
    return fullPath;
}

export class EnvaultMcpServer {
    private server: McpServer;

    constructor() {
        this.server = new McpServer({
            name: "envault-mcp",
            version: "0.1.0",
        });

        console.error("Envault MCP Server initializing...");

        this.setupTools();
        this.setupResources();
    }

    private setupTools() {
        // TOOL: get_status - Quick health check for current directory
        this.server.tool(
            "get_status",
            "Get a quick health overview of the current directory's encryption status. Shows whether .env exists, if it's encrypted, key availability, and sync status. Use this FIRST when working with a new project to understand its current state.",
            {},
            async () => {
                console.error("Executing tool: get_status");
                const cwd = process.cwd();

                let envExists = false;
                let encExists = false;
                let keyLoaded = false;
                let envValid = true;

                try { await fs.access(path.join(cwd, '.env')); envExists = true; } catch { }
                try { await fs.access(path.join(cwd, 'config.enc')); encExists = true; } catch { }
                keyLoaded = !!process.env.ENVOAK_KEY && envManager.validateKey(process.env.ENVOAK_KEY);

                if (envExists) {
                    const content = await fs.readFile(path.join(cwd, '.env'), 'utf-8');
                    const check = envManager.validateEnv(content);
                    envValid = check.valid;
                }

                let status = 'UNKNOWN';
                if (encExists && !envExists) status = 'MISSING';
                else if (envExists && !encExists) status = 'UNTRACKED';
                else if (envExists && encExists) status = 'SYNCED';
                else status = 'NONE';

                const result = {
                    directory: cwd,
                    status,
                    env: { exists: envExists, valid: envValid },
                    encrypted: { exists: encExists },
                    key: { loaded: keyLoaded },
                    suggestion: !keyLoaded
                        ? 'Run `envoak init` to generate a key, or set ENVOAK_KEY environment variable'
                        : status === 'UNTRACKED'
                            ? 'Run `envoak push` to encrypt your .env file'
                            : status === 'MISSING'
                                ? 'Run `envoak pull` to restore your .env from encrypted backup'
                                : null
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
        );

        // TOOL: audit_directory - Scan directory tree for env health
        this.server.tool(
            "audit_directory",
            "Scan a directory tree to audit .env file health across multiple projects. Returns status for each subdirectory: SYNCED (both .env and config.enc exist), UNTRACKED (.env exists but not encrypted - security risk!), MISSING (config.enc exists but .env was deleted - may need recovery). Use this to get a bird's-eye view of secrets management across a monorepo or workspace.",
            { path: z.string().default(".").describe("Directory to audit. Defaults to current directory.") },
            async ({ path: dirPath }) => {
                console.error(`Executing tool: audit_directory path=${dirPath}`);
                const rootDir = path.resolve(dirPath);
                const results = [];

                try {
                    const entries = await fs.readdir(rootDir, { withFileTypes: true });
                    const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

                    for (const dir of dirs) {
                        const envPath = path.join(rootDir, dir.name, '.env');
                        const encPath = path.join(rootDir, dir.name, 'config.enc');

                        let envExists = false;
                        let encExists = false;
                        try { await fs.access(envPath); envExists = true; } catch { }
                        try { await fs.access(encPath); encExists = true; } catch { }

                        let status = "UNKNOWN";
                        if (encExists && !envExists) status = "MISSING";
                        else if (envExists && !encExists) status = "UNTRACKED";
                        else if (envExists && encExists) status = "SYNCED";

                        let valid = true;
                        if (envExists) {
                            const content = await fs.readFile(envPath, 'utf-8');
                            const check = envManager.validateEnv(content);
                            valid = check.valid;
                        }

                        if (envExists || encExists) {
                            results.push({ dir: dir.name, status, valid });
                        }
                    }
                    return {
                        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
                    };

                } catch (err: any) {
                    return {
                        isError: true,
                        content: [{ type: "text", text: `Error auditing: ${err.message}` }],
                    };
                }
            }
        );

        // TOOL: check - Validate .env formatting
        this.server.tool(
            "check",
            "Validate .env file formatting and syntax. Catches common issues: missing trailing newlines (causes bugs in some parsers), spaces around equals signs (often unintentional), missing separators. Use this before committing to prevent production outages.",
            {
                filePath: z.string().default(".env").describe("Path to .env file to check"),
                fix: z.boolean().default(false).describe("If true, automatically fix issues that can be auto-corrected")
            },
            async ({ filePath, fix }) => {
                console.error(`Executing tool: check filePath=${filePath} fix=${fix}`);
                try {
                    const fullPath = path.resolve(filePath);
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const result = envManager.validateEnv(content);

                    if (fix && result.fixedContent) {
                        await fs.writeFile(fullPath, result.fixedContent);
                        result.fixed = true;
                    }

                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: push - Encrypt .env to config.enc
        this.server.tool(
            "push",
            "Encrypt .env file to config.enc for safe Git commits. This is the primary way to backup your secrets - the encrypted file can be committed to version control. Requires ENVOAK_KEY environment variable to be set (64-char hex). Use after modifying .env to update the encrypted backup.",
            {
                force: z.boolean().default(false).describe("If true, overwrite existing config.enc without confirmation")
            },
            async ({ force }) => {
                console.error(`Executing tool: push force=${force}`);
                const cwd = process.cwd();
                const envPath = path.join(cwd, '.env');
                const encPath = path.join(cwd, 'config.enc');

                try {
                    const key = process.env.ENVOAK_KEY;
                    if (!key) {
                        return {
                            isError: true,
                            content: [{ type: "text", text: "ENVOAK_KEY not set. Run `envoak init` to generate a key, then set it as environment variable." }]
                        };
                    }

                    if (!force) {
                        try {
                            await fs.access(encPath);
                            return {
                                isError: true,
                                content: [{ type: "text", text: "config.enc already exists. Use force=true to overwrite." }]
                            };
                        } catch { }
                    }

                    const content = await fs.readFile(envPath, 'utf-8');
                    const encrypted = envManager.encryptEnv(content, key);
                    await fs.writeFile(encPath, encrypted);

                    return {
                        content: [{ type: "text", text: `✅ Encrypted .env → config.enc (${encrypted.length} bytes)` }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: pull - Decrypt config.enc to .env
        this.server.tool(
            "pull",
            "Decrypt config.enc back to .env file. Use this to restore secrets on a new machine or after cloning a repo. Requires ENVOAK_KEY environment variable (the same key used to encrypt). WARNING: This will overwrite existing .env unless force=false.",
            {
                force: z.boolean().default(false).describe("If true, overwrite existing .env without confirmation")
            },
            async ({ force }) => {
                console.error(`Executing tool: pull force=${force}`);
                const cwd = process.cwd();
                const envPath = path.join(cwd, '.env');
                const encPath = path.join(cwd, 'config.enc');

                try {
                    const key = process.env.ENVOAK_KEY;
                    if (!key) {
                        return {
                            isError: true,
                            content: [{ type: "text", text: "ENVOAK_KEY not set. You need the original encryption key to decrypt." }]
                        };
                    }

                    if (!force) {
                        try {
                            await fs.access(envPath);
                            return {
                                isError: true,
                                content: [{ type: "text", text: ".env already exists. Use force=true to overwrite." }]
                            };
                        } catch { }
                    }

                    const encrypted = await fs.readFile(encPath, 'utf-8');
                    const decrypted = envManager.decryptEnv(encrypted, key);
                    await fs.writeFile(envPath, decrypted);

                    return {
                        content: [{ type: "text", text: `✅ Decrypted config.enc → .env (${decrypted.length} bytes)` }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: encrypt_file - Encrypt arbitrary file
        this.server.tool(
            "encrypt_file",
            "Encrypt any file (not just .env) using AES-256-GCM. Creates a .enc file alongside the original. Use for encrypting sensitive configs, certificates, or any file you want to commit safely. Requires explicit key parameter for security.",
            {
                filePath: z.string().describe("Path to file to encrypt"),
                key: z.string().describe("ENVOAK_KEY - 64 character hex string for encryption")
            },
            async ({ filePath, key }) => {
                console.error(`Executing tool: encrypt_file filePath=${filePath}`);
                try {
                    const fullPath = validatePathWithinCwd(filePath);
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const encrypted = envManager.encryptEnv(content, key);
                    const outputPath = fullPath + ".enc";
                    await fs.writeFile(outputPath, encrypted);
                    return {
                        content: [{ type: "text", text: `✅ Encrypted to ${outputPath}` }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: decrypt_file - Decrypt arbitrary file
        this.server.tool(
            "decrypt_file",
            "Decrypt a .enc file back to its original content. Requires the same key used for encryption. If outputPath not specified, removes .enc extension or adds .decrypted suffix.",
            {
                filePath: z.string().describe("Path to encrypted .enc file"),
                key: z.string().describe("ENVOAK_KEY - 64 character hex string used for encryption"),
                outputPath: z.string().optional().describe("Optional output path. Defaults to removing .enc extension.")
            },
            async ({ filePath, key, outputPath }) => {
                console.error(`Executing tool: decrypt_file filePath=${filePath}`);
                try {
                    const fullPath = validatePathWithinCwd(filePath);
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const decrypted = envManager.decryptEnv(content, key);

                    let dest = outputPath ? validatePathWithinCwd(outputPath) : fullPath.replace(/\.enc$/, '');
                    if (dest === fullPath) dest += ".decrypted";

                    await fs.writeFile(dest, decrypted);
                    return {
                        content: [{ type: "text", text: `✅ Decrypted to ${dest}` }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: generate_key - Create new encryption key
        this.server.tool(
            "generate_key",
            "Generate a new 256-bit (64 hex character) encryption key. Store this securely - you'll need it to decrypt your files! Common storage: environment variable, password manager, or secure note. NEVER commit the key to Git.",
            {},
            async () => {
                console.error("Executing tool: generate_key");
                const key = envManager.generateKey();
                return {
                    content: [{
                        type: "text",
                        text: `🔑 Generated ENVOAK_KEY:\n\n${key}\n\n⚠️ Store this securely! You need it to decrypt your files.\nSet as: export ENVOAK_KEY=${key}`
                    }]
                };
            }
        );
    }

    private setupResources() {
        // TODO: Implement reading resources if valid use case found
        // For now, tools cover most interactive agent needs.
    }

    public async start() {
        console.error("Envault MCP Server starting...");
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Envault MCP Server connected to transport.");
    }
}
