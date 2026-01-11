# Contributing to envoak

Thanks for your interest in contributing! 🔐

## Overview

envoak is a secure secrets management tool that provides encryption for environment files with optional cloud backup via Myceliumail.

## Development Setup

```bash
git clone https://github.com/treebird7/envoak.git
cd envoak

npm install
npm run build
```

## Testing Locally

```bash
# Generate a key
node dist/bin/envoak.js keygen

# Encrypt a file
ENVAULT_KEY=<your-key> node dist/bin/envoak.js encrypt .env

# Decrypt a file
ENVAULT_KEY=<your-key> node dist/bin/envoak.js decrypt .env.enc
```

## Environment Variables

```
ENVAULT_KEY=<64-character-hex-key>
```

## Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run build` to ensure it compiles
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Code Style

- TypeScript with strict mode
- Use async/await over callbacks
- Keep crypto operations in dedicated modules
- Never log keys or decrypted content

## Security

- Use AES-256-GCM for encryption
- Keys are derived from provided ENVAULT_KEY
- Report security issues privately to security@treebird.uk

## Issues

Found a bug? Have a feature request? Please open an issue on GitHub:
https://github.com/treebird7/envoak/issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

*"Secrets stay secret."* 🔐🌳
