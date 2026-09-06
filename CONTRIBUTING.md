# Contributing

Thanks for your interest in contributing to `pi-freellmapi`! This document provides guidelines and instructions.

## Getting Started

### Prerequisites

- Node.js >= 22
- npm >= 9
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/7thw/pi-freellmapi.git
cd pi-freellmapi

# Install dependencies
npm install

# Run tests to verify setup
npm test

# Type check
npm run typecheck
```

## Development Workflow

### Code Style

We use [Biome](https://biomejs.dev/) for formatting and linting:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Check everything
npm run check
```

### Testing

Write tests for new features:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npx vitest
```

### Type Checking

All code must pass TypeScript strict mode:

```bash
npm run typecheck
```

## Pull Request Process

1. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear commits
   ```bash
   git add .
   git commit -m "feat: add new model discovery feature"
   ```

3. **Run checks** before submitting
   ```bash
   npm run check
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Describe your changes** in the PR template:
   - What changed
   - Why it changed
   - How to test
   - Any breaking changes

## Code Organization

```
pi-freellmapi/
├── index.ts           # Extension entry point
├── src/
│   ├── auth.ts        # Credential management
│   ├── cache.ts       # Model caching
│   ├── catalog.ts     # Model discovery
│   ├── config.ts      # Configuration
│   ├── login.ts       # OAuth login
│   └── provider.ts    # Provider registration
├── test/
│   ├── catalog.test.ts
│   ├── config.test.ts
│   ├── provider.test.ts
│   ├── cache.test.ts
│   └── auth.test.ts
└── docs/
    └── ...
```

## Testing Guidelines

### Unit Tests

- Test pure functions in isolation
- Mock external dependencies (fs, network)
- Cover edge cases and error paths
- Aim for >80% coverage

### Integration Tests

- Test extension lifecycle
- Verify provider registration
- Check credential flow
- Test cache read/write

### Test Examples

```typescript
import { expect, test, vi } from 'vitest'
import { normalizeBaseUrl } from '../src/config.ts'

test('normalizeBaseUrl adds /v1 when missing', () => {
  expect(normalizeBaseUrl('http://localhost:3001')).toBe('http://localhost:3001/v1')
})
```

## Documentation

### README

Update README.md for user-facing changes:
- New features
- Configuration changes
- Breaking changes

### Code Comments

Add comments for:
- Complex logic
- Security considerations
- Non-obvious behavior

## Release Process

### Version Bumping

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Publishing

```bash
# Login to npm
npm login

# Publish
npm publish --access public
```

### Changelog

Update CHANGELOG.md with:
- Date
- Version
- Changes categorized as Features/Fixes/Breaking

## Security

See [SECURITY.md](SECURITY.md) for security practices.

Report vulnerabilities privately - do not open public issues.

## Community

- **Issues**: [GitHub Issues](https://github.com/7thw/pi-freellmapi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/7thw/pi-freellmapi/discussions)
- **License**: MIT

## Recognition

Contributors will be acknowledged in:
- README.md
- CHANGELOG.md
- GitHub releases

Thank you for contributing! 🎉
