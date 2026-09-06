# pi-freellmapi

A Pi package extension that discovers models from a FreeLLMAPI gateway and registers them as the native `freellmapi` provider.

[![npm version](https://img.shields.io/npm/v/pi-freellmapi.svg)](https://www.npmjs.com/package/pi-freellmapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Automatic Model Discovery**: Fetches available models from FreeLLMAPI gateway
- **Live Catalog Refresh**: Periodically updates model catalog (10-minute intervals)
- **Cached Models**: Stores discovered models locally for offline use
- **OAuth Integration**: Supports native Pi login flow
- **TypeScript Support**: Full type safety with strict mode

## Installation

### As a Pi Package

```bash
pi install npm:pi-freellmapi
```

### Manual Installation

```bash
npm install pi-freellmapi
```

### Local Development

For local development, add to your `~/.pi/settings.json`:

```json
{
  "packages": [
    "../../path/to/pi-freellmapi"
  ]
}
```

## Configuration

Set environment variables before starting Pi:

```bash
export FREELLMAPI_BASE_URL=http://127.0.0.1:31415/v1
export FREELLMAPI_API_KEY=<your-unified-api-key>
export FREELLMAPI_MAX_TOKENS=8192
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FREELLMAPI_BASE_URL` | FreeLLMAPI gateway base URL | `http://127.0.0.1:31415/v1` |
| `FREELLMAPI_API_KEY` | Unified API key for authentication | Required for model discovery |
| `FREELLMAPI_MAX_TOKENS` | Maximum tokens for model responses | `8192` |

**Note**: The base URL automatically appends `/v1` if missing. The default assumes FreeLLMAPI runs on port `31415`, but any valid host and port are supported (e.g., `http://localhost:3000/v1`).

## Usage

### Native Login Flow

Use Pi's built-in login command:

```bash
pi /login -> FreeLLMAPI
pi /model -> freellmapi/auto
```

The extension will:
1. Prompt for base URL and API key
2. Fetch the live model catalog
3. Register discovered models as the `freellmapi` provider

### Programmatic Usage

```typescript
import { createLoginFreeLlmApi, getFreeLlmApiKey } from 'pi-freellmapi';
import { fetchCatalog } from 'pi-freellmapi/catalog';

// Fetch catalog directly
const models = await fetchCatalog('http://127.0.0.1:31415/v1', 'your-api-key');

// Create login handler
const loginHandler = createLoginFreeLlmApi(async (baseUrl, apiKey, models) => {
  console.log(`Found ${models.length} models`);
});
```

## Provider Registration

The extension registers a provider with ID `freellmapi` that:

- Uses the `openai-completions` API format
- Supports OAuth-style authentication
- Automatically refreshes the model catalog
- Caches models locally for resilience

### Discovered Models

Models are fetched from `GET <base-url>/models` with bearer authentication. The extension:

- Shows available models with valid context windows
- Includes special models: `auto`, `fusion`, and named profiles (`auto:<profile-name>`)
- Filters out disabled, malformed, duplicate, and context-less entries
- Uses native OpenAI-compatible implementation

## Architecture

### Files

```
pi-freellmapi/
├── index.ts           # Extension entry point
├── src/
│   ├── auth.ts        # Credential loading from auth.json
│   ├── cache.ts       # Model catalog caching
│   ├── catalog.ts     # Model discovery and parsing
│   ├── config.ts      # Configuration handling
│   ├── login.ts       # OAuth login flow
│   └── provider.ts    # Provider configuration
└── test/
    ├── catalog.test.ts
    ├── config.test.ts
    ├── provider.test.ts
    ├── cache.test.ts
    └── auth.test.ts
```

### Key Components

1. **Extension Singleton**: Ensures only one instance runs per session
2. **Polling Mechanism**: Refreshes catalog every 10 minutes with exponential backoff
3. **Cache System**: Stores model metadata (IDs, names, context windows, base URL) in `~/.pi/agent/cache/freellmapi-models.json`
4. **Credential Management**: Reads credentials from host's auth.json using Pi's credential system (never writes credentials)

## Security

- **API Key Storage**: API keys are stored by the host's native OAuth system in `auth.json`
- **URL Caching**: Base URLs are cached in `~/.pi/agent/cache/freellmapi-models.json` (without API keys)
- **Read-Only Credentials**: Extension only reads credentials from host's secure storage, never writes them
- **Input Validation**: All URLs and keys are validated and sanitized
- **Error Handling**: Credentials are never logged or exposed in errors
- **Timeout Protection**: All network requests have timeouts to prevent hangs

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Type check
npm run typecheck

# Format check
npm run format
```

## Development

### Prerequisites

- Node.js >= 22
- npm >= 9

### Local Development

```bash
# Clone and install
git clone https://github.com/7thw/pi-freellmapi.git
cd pi-freellmapi
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Format code
npm run format
```

### Publishing to npm

```bash
# Login to npm
npm login

# Publish
npm publish --access public
```

## Compatibility

- **Pi Version**: Requires Pi >= 0.8.1
- **Node.js**: >= 22
- **API Format**: OpenAI Completions API compatible

## Dependencies

### Peer Dependencies

- `@earendil-works/pi-ai`
- `@earendil-works/pi-coding-agent`

### Dev Dependencies

- `@biomejs/biome` - Linter and formatter
- `typescript` - Type checking
- `vitest` - Testing framework

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/7thw/pi-freellmapi/issues)
- **Documentation**: [Pi Documentation](https://github.com/earendil-works/pi)
- **FreeLLMAPI**: [FreeLLMAPI GitHub](https://github.com/your-freellmapi-repo)

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.
