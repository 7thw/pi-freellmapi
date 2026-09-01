# pi-freellmapi

A shared Pi and Prime Agent extension that discovers available models from a
running FreeLLMAPI gateway and registers them as the native `freellmapi`
provider.

## Factory development

The factory source is:

```text
/Users/macdadyo/__HUBGENTIC/__AGENTS/_factory-extensions/_pi/_pi-freellmapi/pi-freellmapi
```

Install and validate it from that directory. Deployment targets are separate:

- Pi: install this local Pi package with:
  `pi install /Users/macdadyo/__HUBGENTIC/__AGENTS/_factory-extensions/_pi/_pi-freellmapi/pi-freellmapi`
  The package source is recorded in `~/.pi/agent/settings.json`; npm packages
  managed by Pi are stored under `~/.pi/agent/npm/`.
- Direct global auto-discovery: `~/.pi/agent/extensions/pi-freellmapi`
- Prime Agent (phase 3): `~/.prime/agent/extensions/pi-freellmapi`

## Configuration

```bash
export FREELLMAPI_BASE_URL=http://127.0.0.1:3001/v1
export FREELLMAPI_API_KEY=<unified-key>
export FREELLMAPI_MAX_TOKENS=8192
```

The default base URL is `http://127.0.0.1:3001/v1`. Any port is supported,
including `31415`. A URL without `/v1` is normalized automatically.

## Native login

Use the host's normal login flow:

```text
/login -> FreeLLMAPI
/model -> freellmapi/auto
```

Login asks for the gateway base URL and unified API key. The key is stored by
the host's native OAuth-shaped credential flow. The extension fetches the live
catalog before login completes.

## Discovered models

The extension reads `GET <base-url>/models` using bearer authentication. It
shows available models with valid context windows, including `auto`, `fusion`,
named `auto:<profile-name>` entries, and available concrete model IDs. Disabled,
malformed, duplicate, and context-less entries are hidden.

All models use the native `openai-completions` implementation. Model IDs are
sent to FreeLLMAPI unchanged, and tool payloads use the normal OpenAI format.
Reasoning and image support are not inferred from names or partial catalog
metadata in this first version.

## Continue comparison

The Continue YAML configuration is only a protocol reference. It is not copied
as a Pi or Prime Agent manifest. Pi and Prime Agent load this TypeScript
extension and its provider registration instead.
