# Contributing to RageVFX

Thank you for your interest in contributing to RageVFX! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20.0.0 or higher
- npm 10.0.0 or higher
- Git

### Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/RageVFX.git
   cd RageVFX
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Style

We use ESLint and Prettier to maintain consistent code style:

- **Format code**: `npm run format`
- **Check formatting**: `npm run format:check`
- **Lint code**: `npm run lint`
- **Fix lint issues**: `npm run lint:fix`
- **Type check**: `npm run type-check`

### Recommended VS Code Extensions

Open the project in VS Code and install the recommended extensions when prompted:

- ESLint
- Prettier
- TypeScript
- GitLens

### Making Changes

1. **Create a branch** for your feature or fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**
   ```bash
   npm run build
   npm run test
   ```

4. **Format and lint**
   ```bash
   npm run format
   npm run lint:fix
   ```

5. **Commit your changes** with clear commit messages
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

Examples:
```
feat: add new particle system node
fix: resolve memory leak in render engine
docs: update installation instructions
refactor: simplify node connection logic
```

### Pull Request Process

1. **Update documentation** if needed

2. **Ensure all tests pass**
   ```bash
   npm run test
   npm run build
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub with:
   - Clear title and description
   - Reference any related issues
   - Screenshots/GIFs for UI changes
   - List of changes made

5. **Address review feedback** if requested

## Code Guidelines

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types when possible
- Use interfaces for data structures
- Document complex types
- Enable strict type checking

### Node Development

When creating new nodes:

1. Extend the `Node` base class
2. Add proper input/output definitions
3. Implement the `process()` method
4. Add comprehensive parameter validation
5. Include error handling
6. Document parameters and behavior
7. Add to appropriate category

Example:
```typescript
import { Node, DataType } from '../core/Node';

export class MyCustomNode extends Node {
  constructor(id: string) {
    super(id, 'MyCustom', 'My Custom Node');
    this.metadata.category = 'Custom';
    this.metadata.description = 'Description of what this node does';
    
    this.addInput('input', 'Input', DataType.IMAGE);
    this.addOutput('output', 'Output', DataType.IMAGE);
    
    this.setParameter('strength', 1.0);
  }

  async process(): Promise<void> {
    // Implementation
  }
}
```

### Testing

- Write tests for new features
- Update tests when changing behavior
- Ensure all tests pass before submitting PR
- Aim for good code coverage

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include inline comments for complex logic
- Update CHANGELOG.md for notable changes

## Project Structure

```
RageVFX/
├── src/
│   ├── core/           # Core engine components
│   ├── nodes/          # Node implementations
│   ├── renderer/       # Rendering engine
│   └── main.ts         # Electron main process
├── ui/                 # Desktop UI assets
├── web/                # Web version
├── marketing/          # Marketing website
├── examples/           # Example projects
├── docs/               # Documentation
└── build/              # Build configuration
```

## Getting Help

- 💬 Discord: [Join our community](https://discord.gg/ragevfx)
- 📧 Email: support@ragevfx.com
- 🐛 Issues: [GitHub Issues](https://github.com/mllinman/RageVFX/issues)
- 📖 Docs: [docs.ragevfx.com](https://docs.ragevfx.com)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## Recognition

Contributors will be:
- Listed in our CONTRIBUTORS.md file
- Mentioned in release notes for significant contributions
- Credited in the application's about dialog

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask! Open an issue or reach out on Discord if you need help getting started.

Thank you for contributing to RageVFX! 🚀
