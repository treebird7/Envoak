# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Envault, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly or use GitHub's private vulnerability reporting
3. Include detailed steps to reproduce the issue
4. Allow reasonable time for a fix before public disclosure

## Security Best Practices

When using Envault:

- **Never commit** `.envault_key` or `.env` files to version control
- **Use** strong, randomly generated `ENVAULT_KEY` values
- **Rotate** keys periodically, especially after team member departures
- **Verify** your `.gitignore` includes sensitive files

## Encryption Details

Envault uses AES-256-GCM for encryption, which provides:
- 256-bit key strength
- Authenticated encryption (integrity + confidentiality)
- Random IVs for each encryption operation

---

*For general questions, use [GitHub Issues](https://github.com/treebird7/Envault/issues)*
