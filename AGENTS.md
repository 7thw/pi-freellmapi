# AGENTS.md

Project context for AI agents working in this repository.

## Project

`pi-freellmapi` — a Pi package/extension that discovers models from a FreeLLMAPI
and registers them as the native `freellmapi` provider in Pi.

- **Language:** TypeScript (ESM, `type: "module"`)
- **Target:** Node.js >= 22 (`engines.node`)
- **License:** MIT
- **Repo:** `7thw/pi-freellmapi` (current branch: `master`)

## Layout

```
index.ts            # Pi extension entry point (registered via package.json "pi.extensions")
src/
  login.ts          # FreeLLMAPI authentication / login flow
  provider.ts       # Registers freellmapi as a native Pi provider
  config.ts         # Configuration (BASE_URL, API_KEY, etc.)
  auth.ts           # Auth helpers
  cache.ts          # Model catalog caching
  catalog.ts        # Model discovery / catalog
test/
  config.test.ts    # normalizeBaseUrl, parseMaxTokens, loadConfig, resolveConfiguredApiKey
  catalog.test.ts   # parseCatalogResponse, fetchCatalog (with mocked fetch)
  cache.test.ts     # readCatalogCache, writeCatalogCache (with temp dirs)
  auth.test.ts      # loadStoredCredential (with temp auth files)
  provider.test.ts  # toProviderConfig, toProviderModels
  login.test.ts     # createLoginFreeLlmApi, getFreeLlmApiKey, refreshFreeLlmApiToken
docs/               # Documentation (git-ignored)
```

> All test model IDs use FreeLLMAPI router identifiers (`auto`, `auto:chain`, `fusion`) — see [docs/freellmapi-router-models.md](docs/freellmapi-router-models.md). Never use specific provider model names like `gpt-4` in tests.

## Available scripts

| Script        | Command                              | What it does                              |
| ------------- | ------------------------------------ | ----------------------------------------- |
| `typecheck`   | `tsc --noEmit`                       | Type-checks `index.ts` + `src/**/*.ts`    |
| `test`        | `vitest run`                         | Runs 6 test files / 77 tests               |
| `test:watch`  | `vitest`                             | Watch mode for TDD                         |
| `format`      | `biome check --write *.ts *.json src test` | Formats + lints with Biome        |
| `check`       | `biome check ... && tsc --noEmit && vitest run` | Full gate: format + typecheck + tests |
| `audit`       | `npm audit`                          | Security audit (npm CLI built-in)          |
| `release`     | `npm publish --access public`        | Publish to npm                            |

## Path aliases

None. Imports are relative (e.g. `./config`), and `allowImportingTsExtensions`
is enabled in `tsconfig.json`.

## Editor settings

`.vscode/settings.json` holds UI color customizations only (title bar, activity
bar, status bar — `#1f6feb` accent). No editor-formatting overrides; Biome owns
formatting via `npm run format`.

## VS Code tasks

`.vscode/tasks.json` (v2.1.0) defines:

- **Install dependencies** — `npm install`, auto-runs on folder open
- **Type Check** — `npm run typecheck` (`$tsc` problem matcher)
- **Run Tests** — `npm test` (`$vitest` problem matcher)
- **Format** — `npm run format`
- **Check (full)** — `npm run check`

Only install auto-runs; everything else is manual.

## Git hooks

None configured. No `.husky/` or `.lintstagedrc.json`. If you add them,
`format` is the natural pre-commit hook target.

## Publishing

This is a `pi-package` (keywords: `pi-package`, `pi-extension`). Publish with
`npm publish` — `package.json#files` limits the tarball to `index.ts`, `src`,
`README.md`, `LICENSE`. `.gitignore` is used as the npm ignore fallback
(`.npmignore` is absent).

### Pre-publish checklist

Validate every edit against official sources before publishing: local `docs/`
copies, the `[opensrc]`-fetched cached repo, Context7, and live npm/pi web docs.
Never publish from memory alone.

**1. Lint & build**
- [ ] `npm run check` — Biome format/lint + `tsc --noEmit` + `vitest run` all green
- [ ] `npm run audit` is clean — runs against `dependencies`, `devDependencies`, `bundledDependencies`, `optionalDependencies` (**not** `peerDependencies`; see [npm audit](docs/npmjs-security-dependencies.md))
- [ ] Did you bump the package version? (`npm version patch|minor|major` — semver `x.x.x`, per [npm creating package.json](docs/npmjs-creating-pck.md))
- [ ] `npm run typecheck` passes (TS target ES2022 / NodeNext, Node >= 22)

**2. Secrets & supply chain**

- [ ] No `.env`, API keys, or secrets in source, cache, or anywhere that lands in the package
- [ ] `.env` is git-ignored (it is a symlink here — confirm it never gets committed)
- [ ] `npm audit` is clean — runs against `dependencies`, `devDependencies`, `bundledDependencies`, `optionalDependencies` (**not** `peerDependencies`; see [npm audit](docs/npmjs-security-dependencies.md))
- [ ] Audit severities addressed: Critical → immediately, High → quickly, Moderate → when time allows, Low → at your discretion ([audit reports](docs/npmjs-security-audit.md))
- [ ] `npm audit fix` applied where compatible; manual review where it isn't
- [ ] Consider adding `npm audit` to CI so it runs on every install/publish

**3. Pi extension correctness**

- [ ] `package.json` has the `pi-package` keyword (required for gallery discoverability)
- [ ] `pi.extensions` points at the real entry point (`./index.ts`)
- [ ] Core Pi packages stay in `peerDependencies` with `"*"` range and are **not** bundled: `@earendil-works/pi-ai`, `@earendil-works/pi-coding-agent` (already correct — do not move them to `dependencies`)
- [ ] Any *other* Pi package you depend on is added to both `dependencies` and `bundledDependencies` so it ships in the tarball ([pi packages](docs/pi-packages.md))
- [ ] `README.md` is at the package root — required; it renders on npmjs.com as GitHub Flavored Markdown ([README docs](docs/npmjs-about-readme.md))
- [ ] README only updates on a new version publish, so bump version if the README changed

**4. Packaging & smoke testing locally**

- [ ] `npm pack --dry-run` — verify exactly what ships (should be `index.ts`, `src`, `README.md`, `LICENSE`)
- [ ] `npm publish --dry-run` — confirm registry readiness without publishing
- [ ] Install the tarball into a throwaway project and load it in Pi to smoke-test the extension actually registers the `freellmapi` provider
- [ ] `pi install npm:<name>@<version>` path works end-to-end

**5. Publish**

- [ ] `npm login` authenticated against the intended registry
- [ ] `npm version <patch|minor|major>` (creates the git tag)
- [ ] `npm publish`
- [ ] Verify on npmjs.com: package page, README rendered, version listed

## References

Official docs cached locally under `docs/` (git-ignored). Re-validate against
live sources (npm docs, pi.dev, Context7, `[opensrc]`) before relying on them:

| Topic | Local doc |
| --- | --- |
| Pi packages — structure, `pi` manifest, bundling, peer deps | [docs/pi-packages.md](docs/pi-packages.md) |
| npm — creating `package.json`, name/version rules | [docs/npmjs-creating-pck.md](docs/npmjs-creating-pck.md) |
| npm — package README requirements & rendering | [docs/npmjs-about-readme.md](docs/npmjs-about-readme.md) |
| npm — `npm audit` dependency coverage & resolution | [docs/npmjs-security-dependencies.md](docs/npmjs-security-dependencies.md) |
| npm — audit report severity levels | [docs/npmjs-security-audit.md](docs/npmjs-security-audit.md) |

Live/external (fetch fresh, don't paraphrase):

- [npm package.json `files` / `.npmignore` behavior](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files)
- [Pi package gallery & `pi-package` keyword](https://pi.dev/packages)
- [npm `npm audit`](https://docs.npmjs.com/cli/v7/commands/npm-audit)

## Conventions

- Run `npm run check` before committing.
- New code goes in `src/`; keep `index.ts` as the thin entry point.
- `docs/` is git-ignored — don't expect it in the repo or the published package.