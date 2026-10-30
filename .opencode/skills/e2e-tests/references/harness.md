# E2E harness — invariants

## Config

| Setting | Value |
|---|---|
| Server | `node tests/support/static-server.mjs out 4310` (GitHub Pages semantics) |
| Port | `E2E_PORT`, default **4310** |
| External server | `E2E_BASE_URL`; disables the launcher |
| Reuse | only `E2E_REUSE_SERVER=1`; default is always fresh |
| Base URL | `http://127.0.0.1:<port>` |
| Default project | `chromium` (Desktop Chrome) |
| Opt-in projects | `mobile-chrome` (Pixel 7), `firefox`, `webkit` |
| Trace | retain on failure |
| Screenshot | only on failure |
| Retries | 2 in CI only |
| Parallelism | fully parallel; each test gets a fresh context |

The static server mirrors the host:

- `/en/courses/` → `out/en/courses/index.html` (200)
- `/en/courses` → 301 → `/en/courses/`
- unknown path → `out/404.html` with HTTP 404
- `_next/**` served as plain files

Do not replace it with `npx serve`; the URL semantics differ from production.

## Fixtures (`tests/e2e/support/fixtures.ts`)

| Fixture | Behaviour |
|---|---|
| storage wipe | removes `v1:*` and `theme` before page scripts on the first document |
| `consoleGuard` | auto; fails on page errors and console errors not allowlisted |
| `speech` | installs deterministic `speechSynthesis` + `SpeechSynthesisUtterance` |
| `makeAxeBuilder` | `AxeBuilder` with WCAG 2.0/2.1 A + AA tags |
| `allowedConsoleErrors` | per-file option; narrow `RegExp[]` |
| external images | non-local image requests fulfilled with a 1×1 GIF |

Always import:

```ts
import { test, expect } from '../support/fixtures'
```

The only legitimate `@playwright/test` imports in specs are **types**:

```ts
import type { Page } from '@playwright/test'
```

## Known console allowlist

`consoleGuard` ignores only:

- RSC `.txt` prefetch 404s — static export prunes those payloads and Next falls
  back to a document navigation. Programmatic `router.push` can still trigger one.
- React DevTools suggestion and `ResizeObserver loop` browser noise.

Everything else must be fixed, or the specific test must opt in:

```ts
// The missing path is expected to return HTTP 404.
test.use({ allowedConsoleErrors: [/404 \(Not Found\)/] })
```

## Storage

Use `tests/e2e/support/storage.ts` when a test needs a pre-existing state.
The wipe is one-shot per document (session marker), so a reload keeps the state
the test wrote; do not add a second global wipe.

## Projects and commands

```bash
npm run build
npm run test:e2e                    # Chromium
npm run test:e2e:mobile-smoke       # mobile-nav under mobile-chrome
npm run test:e2e:integration        # integration folder
npm run test:e2e:journeys           # journeys folder
npm run test:e2e:matrix             # firefox + webkit + mobile (needs browsers)
```

`firefox`/`webkit` need their browser binaries and system libraries installed.
Do not treat an unavailable browser as a product failure; report it.
