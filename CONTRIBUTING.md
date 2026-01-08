# Contributing to Envault

Thank you for your interest in contributing to Envault! 🔐

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Envault.git
   cd Envault
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Build** the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes in `src/`
3. Build and test:
   ```bash
   npm run build
   node dist/bin/envault.js --help
   ```
4. Commit with a descriptive message:
   ```bash
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Submitting a Pull Request

1. Push your branch to GitHub
2. Open a Pull Request against `main`
3. Fill out the PR template
4. Wait for review and address feedback

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Keep functions focused and well-documented

## Questions?

Open an [issue](https://github.com/treebird7/Envault/issues) or reach out via the project discussions.

---

*Maintained by [Treebird](https://treebird.uk)*
