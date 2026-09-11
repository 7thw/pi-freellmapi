# Changelog

All notable changes to `pi-freellmapi` will be documented in this file.

## [0.1.0] - 2026-09-10

### Added
- Initial public release
- CLI tool for discovering FreeLLMAPI models
- Model caching with local storage
- Multiple output formats (table, JSON, markdown)
- Comprehensive test suite (62 tests)
- Security documentation

### Changed
- Updated default port from 3001 to 31415
- Improved credential handling
- Added build pipeline for TypeScript compilation

### Security
- All credentials loaded from Pi's secure auth system
- No API keys stored in cache or logs
- Input validation on all URLs
- Network timeouts enforced
