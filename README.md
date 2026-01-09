<p align="center">
  <img src="https://raw.githubusercontent.com/treebird7/Envault/main/assets/glyph_envoak.png" alt="envoak" width="180" />
</p>

# 🌳 envoak

[![npm version](https://img.shields.io/npm/v/envoak.svg)](https://www.npmjs.com/package/envoak)
[![npm downloads](https://img.shields.io/npm/dm/envoak.svg)](https://www.npmjs.com/package/envoak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Encrypted Git-Ops for your Environment Variables.**

envoak is a simple, secure CLI tool to manage your `.env` files. It encrypts your secrets so you can commit them to Git, and validates your `.env` formatting to prevent production outages.

🌐 **Website:** [treebird.uk/envoak](https://treebird.uk/envoak) | 📦 **npm:** [envoak](https://www.npmjs.com/package/envoak)

## 🚀 Quick Start

```bash
# 1. Install (Global)
npm install -g envoak

# 2. Initialize in your repo
envoak init
# -> Generates a new ENVOAK_KEY. Save this!

# 3. Validate your .env
envoak check
# -> Detects missing newlines, spacing issues, etc.

# 4. Encrypt & Commit
envoak push
# -> Encrypts .env -> config.enc (Safe to commit)
git add config.enc
```

## 📦 Commands

| Command | Description |
|---------|-------------|
| `envoak init` | Generate a new 256-bit encryption key |
| `envoak check [--fix]` | Validate `.env` formatting |
| `envoak push [--force]` | Encrypt `.env` → `config.enc` |
| `envoak pull [--force]` | Decrypt `config.enc` → `.env` |
| `envoak audit -d <dir>` | Scan directory tree for `.env` health |
| `envoak file push/pull` | Encrypt/decrypt arbitrary files |
| `envoak scan <cmd>` | Run command across all subdirectories |
| `envoak keys --generate` | Generate Ed25519 identity keys |
| `envoak mcp` | Start MCP server for AI agents |

## 🔄 Multi-Repo Management

Manage environment variables across multiple repositories from a single parent directory:

```bash
cd ~/Dev
envoak init           # Create master key in parent
envoak scan push      # Encrypt all .env files in subdirectories
envoak scan pull      # Decrypt all on a new machine
```

## 🔗 Mycmail Integration

envoak integrates with [Myceliumail](https://www.npmjs.com/package/myceliumail) for secure agent identity management:

```bash
# Generate Mycmail-compatible identity keys
envoak keys --generate
# -> Appends MYCELIUMAIL_PRIVATE_KEY to .env

# Encrypt and backup
envoak push
```

## 🤖 AI Agents (MCP)

envoak includes a native [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for AI agent integration.

**Add to your MCP config:**

```json
{
  "mcpServers": {
    "envoak": {
      "command": "envoak",
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
