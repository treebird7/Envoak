# 🔐 Envault

[![npm version](https://img.shields.io/npm/v/envault.svg)](https://www.npmjs.com/package/envault)
[![npm downloads](https://img.shields.io/npm/dm/envault.svg)](https://www.npmjs.com/package/envault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Encrypted Git-Ops for your Environment Variables.**

Envault is a simple, secure CLI tool to manage your `.env` files. It encrypts your secrets so you can commit them to Git, and validates your `.env` formatting to prevent production outages.

🌐 **Website:** [treebird.uk](https://treebird.uk) | 📦 **npm:** [envault](https://www.npmjs.com/package/envault)

## 🚀 Quick Start

```bash
# 1. Install (Global)
npm install -g envault

# 2. Initialize in your repo
envault init
# -> Generates a new ENVAULT_KEY. Save this!

# 3. Validate your .env
envault check
# -> Detects missing newlines, spacing issues, etc.

# 4. Encrypt & Commit
envault push
# -> Encrypts .env -> config.enc (Safe to commit)
git add config.enc
```

## 📦 Commands

| Command | Description |
|---------|-------------|
| `envault init` | Generate a new 256-bit encryption key |
| `envault check [--fix]` | Validate `.env` formatting |
| `envault push [--force]` | Encrypt `.env` → `config.enc` |
| `envault pull [--force]` | Decrypt `config.enc` → `.env` |
| `envault audit -d <dir>` | Scan directory tree for `.env` health |
| `envault file push/pull` | Encrypt/decrypt arbitrary files |
| `envault scan <cmd>` | Run command across all subdirectories |
| `envault keys --generate` | Generate Ed25519 identity keys |
| `envault mcp` | Start MCP server for AI agents |

## 🔄 Multi-Repo Management

Manage environment variables across multiple repositories from a single parent directory:

```bash
cd ~/Dev
envault init           # Create master key in parent
envault scan push      # Encrypt all .env files in subdirectories
envault scan pull      # Decrypt all on a new machine
```

## 🔗 Mycmail Integration

Envault integrates with [Mycmail](https://github.com/treebird7/myceliumail) for secure agent identity management:

```bash
# Generate Mycmail-compatible identity keys
envault keys --generate
# -> Appends MYCELIUMAIL_PRIVATE_KEY to .env

# Encrypt and backup
envault push
```

## 🤖 AI Agents (MCP)

Envault includes a native [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for AI agent integration.

**Add to your MCP config:**

```json
{
  "mcpServers": {
    "envault": {
      "command": "envault",
      "args": ["mcp"]
    }
  }
}
```

**MCP Tools:**
- `audit_directory` - Scan repo health
- `encrypt_file` / `decrypt_file` - Manage secrets
- `generate_key` - Create new keys

## 🔒 Security

- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key**: 256-bit (64 hex characters) random key
- **Integrity**: GCM ensures files haven't been tampered with

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

---

*Part of the [Treebird Ecosystem](https://treebird.uk) 🌳*
