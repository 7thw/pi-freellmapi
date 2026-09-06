# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of pi-freellmapi extension
- Automatic model discovery from FreeLLMAPI gateway
- OAuth integration with Pi's login flow
- Local caching of model catalogs
- Periodic catalog refresh (10-minute intervals)
- Comprehensive test suite
- Full TypeScript support

### Changed
- None

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Secure credential handling via Pi's auth system
- No plaintext storage of API keys
- Input validation on all URLs and keys
- Timeout protection for network requests

## [0.1.0] - 2025-09-05

### Added
- Initial public release
- Pi package extension for FreeLLMAPI integration
- Provider registration with `openai-completions` API
- Environment variable configuration support
- Native login flow via `/login -> FreeLLMAPI`
- Model filtering (removes duplicates, invalid entries)
- Cache system for offline resilience
- Error handling and graceful degradation
- Full test coverage
- Comprehensive documentation

### Security
- Bearer token authentication
- URL normalization and validation
- Safe credential loading from auth.json
- Timeout protection (15s default)

### Dependencies
- `@earendil-works/pi-ai`: ^0.8.1
- `@earendil-works/pi-coding-agent`: ^0.8.1
- `typescript`: ^5.7.2
- `vitest`: ^2.1.8
- `@biomejs/biome`: ^1.9.4

---

## Version History

### v0.1.0
- First public release
- Core functionality complete
- Tests passing
- Documentation comprehensive

---

**Note**: This is an early release. API and configuration may change in future versions.
