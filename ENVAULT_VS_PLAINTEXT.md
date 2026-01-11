# Envoak vs. Traditional Plaintext Configuration

## Overview

This document explains the key differences between Envoak's encrypted secret management and traditional plaintext configuration services.

**Note:** The project is called **Envoak** (the CLI tool name), while the npm package is published as `@treebird/envault`.

---

## **Traditional Plaintext Services** vs **Envoak**

### **Traditional Approach**
- **Purpose:** Loads configuration files into environment variables at runtime
- **Security:** ⚠️ Plaintext - secrets stored unencrypted
- **Usage:** Configuration loaded from local files
- **Typical file:** `.env` (must be gitignored)
- **Protection:** Relies on keeping files out of version control

### **Envoak**
- **Purpose:** Encrypts secrets in your repository using AES-256-GCM
- **Security:** 🔐 Encrypted - secrets stored encrypted in git
- **Usage:** `envoak encrypt .env` → creates `.env.vault`
- **Typical files:** `.env.vault` (committed), key stored separately
- **Protection:** Cryptographic - encrypted secrets can live in your repo
- **CLI:** `envoak` command-line tool
- **Package:** `@treebird/envault` on npm

---

## Key Differences

| Feature | Traditional Plaintext | Envoak |
|---------|----------------------|---------|
| **Encryption** | None | AES-256-GCM |
| **Commit to git** | ❌ No | ✅ Yes (.env.vault) |
| **Algorithm** | N/A | Authenticated encryption (AEAD) |
| **Key management** | N/A | 64-char hex key |
| **MCP support** | No | Yes (MCP server included) |
| **Path protection** | No | Yes (prevents traversal) |
| **Integrity verification** | No | Yes (GCM auth tag) |
| **Team sharing** | Manual/insecure | Encrypted in repo |

---

## Workflow Comparison

### **Traditional Plaintext:**
```bash
# .env stays local, never committed
echo "SECRET=password123" > .env
# Must share secrets via Slack/email/password manager
node app.js  # Loads plaintext config
```

### **Envault:**
```bash
# Encrypt secrets into repo
envoak encrypt .env
git add .env.vault  # Commit encrypted version
git push

# On another machine
export ENVAULT_KEY="your-64-char-key"
envoak decrypt .env.vault  # Recreates .env
```

---

## Security Comparison

### Traditional Plaintext Risks:
- 😰 Accidental git commits expose secrets forever
- 📧 Insecure sharing via email/chat
- 🔓 No encryption at rest
- ⚠️ No integrity verification
- 🗑️ Hard to rotate secrets across team

### Envault Protection:
- 🔐 **AES-256-GCM encryption** - Industry-standard authenticated encryption
- ✅ **Integrity verification** - Detects tampering via authentication tag
- 🛡️ **Path traversal protection** - MCP server validates all file operations
- 🔑 **Single key management** - One ENVAULT_KEY controls access
- 📦 **Safe to commit** - Encrypted .env.vault lives in git
- 🔄 **Easy rotation** - Re-encrypt with new key when needed

---

## When to Use Each

### **Traditional Plaintext:**
- Local development only
- Secrets never need to be shared
- Single developer projects
- Low-security requirements

### **Envault:**
- Team collaboration
- CI/CD pipelines
- Multiple environments (dev/staging/prod)
- Encrypted backup of secrets in git
- AI agent access via MCP
- Compliance requirements

---

## Encryption Technical Details

### Envault Implementation

**Algorithm:** AES-256-GCM (Galois/Counter Mode)

| Component | Implementation | Purpose |
|-----------|---------------|---------|
| **Cipher** | AES-256 | Block cipher for confidentiality |
| **Mode** | GCM | Authenticated encryption (AEAD) |
| **IV** | 16 bytes random | Prevents pattern analysis |
| **Key** | 256-bit (64 hex) | Cryptographic key |
| **Auth Tag** | 128-bit GCM tag | Integrity verification |

**Encrypted format:** `IV:AuthTag:Ciphertext`

**Security guarantees:**
- ✅ Confidentiality (can't read without key)
- ✅ Integrity (can't modify without detection)
- ✅ Authenticity (proves who encrypted it)

---

## Bottom Line

**Traditional plaintext services** load unencrypted configuration files. Secrets must stay local and can't be safely committed.

**Envoak** encrypts secrets with AES-256-GCM so you can safely store them in version control, share them with your team, and provide secure access to AI agents via MCP.

**The difference:** Plaintext requires trust. Envault uses cryptography.

---

**Audited by:** Sherlocksan (srlk)
**Audit date:** 2026-01-08
**Status:** ✅ PASS - Ready for production use

> "The ecosystem is smarter than any individual agent." — and encryption is smarter than obscurity.
