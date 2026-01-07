
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
        // TOOL: audit_directory
        this.server.tool(
            "audit_directory",
            { path: z.string().default(".") },
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
                        // Note: SYNCED doesn't verify content match, just existence

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

        // TOOL: encrypt_file
        this.server.tool(
            "encrypt_file",
            {
                filePath: z.string(),
                key: z.string().describe("ENVAULT_KEY (64 chars hex)")
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
                        content: [{ type: "text", text: `Encrypted to ${outputPath}` }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: decrypt_file
        this.server.tool(
            "decrypt_file",
            {
                filePath: z.string(),
                key: z.string().describe("ENVAULT_KEY (64 chars hex)"),
                outputPath: z.string().optional()
            },
            async ({ filePath, key, outputPath }) => {
                console.error(`Executing tool: decrypt_file filePath=${filePath}`);
                try {
                    const fullPath = validatePathWithinCwd(filePath);
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const decrypted = envManager.decryptEnv(content, key);

                    let dest = outputPath ? validatePathWithinCwd(outputPath) : fullPath.replace(/\.enc$/, '');
                    if (dest === fullPath) dest += ".decrypted"; // prevent overwrite if file not .enc

                    await fs.writeFile(dest, decrypted);
                    return {
                        content: [{ type: "text", text: `Decrypted to ${dest}` }],
                    };
                } catch (err: any) {
                    return { isError: true, content: [{ type: "text", text: String(err) }] };
                }
            }
        );

        // TOOL: generate_key
        this.server.tool(
            "generate_key",
            {},
            async () => {
                console.error("Executing tool: generate_key");
                const key = envManager.generateKey();
                return {
                    content: [{ type: "text", text: key }]
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
