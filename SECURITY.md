# Security

This document outlines the security practices and considerations for `pi-freellmapi`.

## Credentials Management

### How Credentials Are Stored

- **API Keys**: Stored by the host's native OAuth system (Pi's `auth.json`)
- **Base URLs**: Stored in environment variables or `auth.json`
- **No Plaintext Storage**: The extension never writes credentials to disk

### Credential Flow

1. User runs `/login -> FreeLLMAPI`
2. Extension prompts for base URL and API key
3. Credentials are stored by the host in its secure credential store
4. Extension reads credentials from host's auth system when needed
5. Credentials are never logged or exposed in error messages

## Data Handling

### What Data Is Collected

- **Model Catalog**: Public information about available models (names, IDs, context windows)
- **Cache**: Local cache of discovered models (no secrets)
- **Configuration**: Base URL and max tokens (no secrets)

### What Data Is NOT Collected

- API keys or tokens
- User conversations or prompts
- Model outputs or responses
- Usage statistics

## Network Security

### HTTPS Enforcement

- Extensions should prefer HTTPS URLs
- HTTP is allowed for local development (e.g., `http://127.0.0.1:3001`)
- URL validation prevents injection attacks

### Timeout Protection

- All network requests have timeouts (15 seconds default)
- Prevents hanging on unresponsive servers
- Graceful fallback to cached data on timeout

### Error Handling

- Errors never expose full URLs or credentials
- Generic error messages for network failures
- Detailed errors only in development mode

## Authentication

### Bearer Token Usage

- API keys sent as `Authorization: Bearer <key>` headers
- Keys are never included in URLs or query parameters
- Headers are set by the Pi framework, not the extension

### OAuth Integration

- Follows Pi's standard OAuth flow
- Supports token refresh (though FreeLLMAPI uses static keys)
- Integrates with Pi's `/login` command

## Input Validation

### URL Validation

```typescript
export function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error("FREELLMAPI_BASE_URL is empty");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}
```

- Rejects empty URLs
- Normalizes trailing slashes
- Ensures `/v1` suffix for API compatibility

### API Key Validation

- Keys must be non-empty strings
- Whitespace is trimmed
- Keys are validated before use

## Model Parsing Security

### Input Sanitization

- All model IDs are trimmed and validated
- Duplicate IDs are filtered out
- Missing or invalid fields are handled gracefully

### Resource Limits

- Context windows are validated as positive finite numbers
- Malformed responses are rejected
- Empty catalogs trigger appropriate errors

## Cache Security

### Local Storage

- Cache stored in `~/.pi/agent/cache/freellmapi-models.json`
- Contains only public model information (no secrets)
- Cache is regenerated on each poll if corrupted

### Cache Validation

- Cache structure is validated before use
- Mismatched API roots invalidate cache
- Corrupted JSON is gracefully ignored

## Dependency Security

### Trusted Dependencies

- Only uses official Pi packages (`@earendil-works/pi-*`)
- No unnecessary dependencies
- All dependencies are open-source

### Dependency Updates

- Regular updates to patch security vulnerabilities
- Pin specific versions for stability
- Test thoroughly before updating

## Audit Trail

### Logging

- No sensitive data in logs
- Error tracking uses generic messages
- Debug logging can be enabled but never includes secrets

### Monitoring

- Extension reports success/failure states
- No telemetry or usage tracking
- Errors are local only (no external reporting)

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email security concerns to: [your-security-email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

## Security Checklist for Contributors

Before submitting PRs, verify:

- [ ] No hardcoded credentials or API keys
- [ ] No logging of sensitive data
- [ ] Input validation on all user-provided values
- [ ] Error messages don't expose secrets
- [ ] Dependencies are from trusted sources
- [ ] Network requests have timeouts
- [ ] File operations handle permissions correctly

## Compliance

This extension aims to follow:

- **OWASP Top 10**: Addressing common web application security risks
- **Pi Security Guidelines**: Following the host framework's security model
- **TypeScript Strict Mode**: Preventing type-related vulnerabilities

## Version Security

### Semantic Versioning

- Major versions may include breaking security changes
- Minor versions add features with backward-compatible security
- Patch versions include security fixes

### Release Process

1. Security review of all changes
2. Dependency vulnerability scan
3. Test suite passes (including security tests)
4. Changelog documents security-relevant changes
