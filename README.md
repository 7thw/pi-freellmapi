# pi-freellmapi

A Pi package and that discovers models from FreeLLMAPI
and registers them as the native `freellmapi` provider.

## freellmapi router & fallback chains(<remote + local models providers>) -> unified API -> pi :D

## Install as a Pi package

```bash
pi install npm:pi-freellmapi
```

## Native pi [/login]

```bash
pi
--
[/reload]
[/login]
[ Select authentication method: 
 Signin with an API key 
 Select provider to configure:
> → FreeLLM API • unconfigured
 - enter BASE_URL 
 - enter API_KEY 
]
[/model] or [/scoped-models]
[ Select any freellmapi/<model>] /** best with router: <auto>, < auto:<chain-name> > **/
--
```

**_Base Url_**

- Default: `http://127.0.0.1:3001/v1` *
- Chat: `/v1/chat/completions`
- Responses: `/v1/responses`
- Messages: `/v1/messages` (Anthropic-compatible (Claude))
- Embeddings: `/v1/embeddings` (model: "auto" or a family from the Embeddings tab)

**_Unified Key & Agent Keys_**

_**hat-to Tashfeen**_
[FreellmAPI Documentation](https://github.com/tashfeenahmed/freellmapi)
