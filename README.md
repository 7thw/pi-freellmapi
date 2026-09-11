# pi-freellmapi

A Pi package extension that discovers models from a FreeLLMAPI gateway and registers them as the native `freellmapi` provider.

[![npm version](https://img.shields.io/npm/v/pi-freellmapi.svg)](https://www.npmjs.com/package/pi-freellmapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Automatic Model Discovery**: Fetches available models from FreeLLMAPI gateway
- **Live Catalog Refresh**: Updates model catalog every 10 minutes
- **Cached Models**: Stores discovered models locally for offline use
- **OAuth Integration**: Uses Pi's native login flow
- **TypeScript Support**: Full type safety

## Installation

### As a Pi Package (Recommended)

```bash
pi install npm:pi-freellmapi
```

### Manual Installation

```bash
npm install pi-freellmapi
```

### Local Development

Add to your `~/.pi/settings.json`:

```json
{
  "packages": [
    "../../path/to/pi-freellmapi"
  ]
}
```

## Configuration

**Recommended**: Let Pi handle credentials securely via `pi /login` → FreeLLMAPI

Only override if needed:
```bash
export FREELLMAPI_BASE_URL=http://127.0.0.1:31415/v1   # Optional
export FREELLMAPI_MAX_TOKENS=8192                      # Optional
```

**Alternative** (less secure - avoids Pi's credential system):
```bash
export FREELLMAPI_BASE_URL=http://127.0.0.1:31415/v1
export FREELLMAPI_API_KEY=<your-api-key>               # ⚠️ Less secure
export FREELLMAPI_MAX_TOKENS=8192
```

## Usage

### Native Login Flow

```bash
pi
--
[/login]
[ Select authentication method:  ]
[ Signin with an API key ]
[ Select provider to configure:
> → FreeLLM API • unconfigured]
[ enter BASE_URL ]
[ enter API_KEY ]

```

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

## How It Works

- **Extension Entry Point**: `index.ts`
- **Source Code**: `src/` directory (auth, cache, catalog, config, login, provider)
- **Credentials**: Read from Pi's secure storage (`~/.pi/agent/auth.json`)
- **Cache**: Model metadata stored in `~/.pi/agent/cache/freellmapi-models.json`
- **Models**: Fetched from `GET <base-url>/models` with bearer auth

## Security

- ✅ API keys stored by Pi's native OAuth system (read-only)
- ✅ Extension never writes credentials, only reads them
- ✅ Cache contains no secrets (only model IDs, names, context windows)
- ✅ All network requests have timeouts
- ✅ Input validation and sanitization
- ✅ Error messages never expose credentials

## Testing

```bash
# Run all tests
npm test

# Type check
npm run typecheck

# Format check
npm run format

# Full check
npm run check
```

## Development

### Prerequisites

- Node.js >= 22
- npm >= 9

### Commands

```bash
# Install
npm install

# Type check
npm run typecheck

# Format
npm run format

# Check (test + typecheck + format)
npm run check
```

## Publishing

```bash
npm login
npm publish --access public
```

## Compatibility

- **Pi Version**: Requires Pi >= 0.85.1
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

MIT - see [LICENSE](LICENSE)

## Documentation

- **Documentation**: [FreellmAPI Documentation](https://github.com/tashfeenahmed/freellmapi)
- **Documentation**: [Pi Documentation](https://github.com/earendil-works/pi)
