---
status: draft
last-verified: 2026-10-16
---

# Architecture

RCP is an Android app (React Native with Expo) for its owner's phone. It talks over HTTPS to a small TypeScript API on the owner's VPS, which holds the recipes and food data in one SQLite file. Nutrition is computed from each recipe's ingredients ([design doc](docs/design-docs/nutrition-from-ingredients.md)). Why this shape: [an Android app with the data on the VPS](docs/design-docs/mobile-app-and-api.md). The [migration plan](docs/exec-plans/active/2026-10-15-mobile-migration.md) is building the app and the API; both skeletons exist.

## Code map
| Path | Holds |
| :-- | :-- |
| `packages/domain/` | `@rcp/domain`: recipe logic in plain TypeScript, for both the app and the API. `units.ts` converts amounts to grams; `recipe.ts` holds the zod schemas both sides validate a recipe and the list query with |
| `apps/api/` | `@rcp/api`: the Hono API on the VPS. `app.ts` holds the routes, `config.ts` reads the environment, `main.ts` serves. `src/db/` holds the Drizzle tables (`schema.ts`), opens the SQLite file, applying the migrations in `drizzle/` (`database.ts`), and reads and writes recipes (`recipes.ts`). esbuild bundles it into one file for its image (`apps/api/Dockerfile`), except better-sqlite3, a native module the image carries beside it. Food imports come later |
| `apps/mobile/` | `@rcp/mobile`: the Expo app for Android (SDK 57, Expo Router). Screens live in `src/app/`; `src/connection/` holds the API address and token (secure storage), the URL check and the connection test. Its own rules: [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md) |
| `deploy/` | What runs on the VPS: `compose.yml` for the API on the shared `edge` network, `rcp.caddy` for ysto's Caddy, and the `.env` template ([DEPLOY.md](docs/DEPLOY.md)). `.github/workflows/release.yml` publishes the image |
| `scripts/` | Repo tooling: the doc and tracked-file checks, the lint-rule tests, the agent guard hook, setup |
| `docs/` | The system of record ([KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md)) |

## Layers
`apps/mobile → apps/api → packages/domain`, over HTTP for the first arrow and imports for the second; `apps/mobile` may import `packages/domain` too.
- `packages/domain` imports nothing but its own files and zod: no other packages, Node APIs or apps. So it runs unchanged on the phone and on the server, and its tests need no setup.
- `apps/api` owns the database and every I/O on the server. The app reaches data only through it.
- `apps/mobile` never imports `apps/api`'s code; it calls its HTTP routes.

ESLint enforces the domain boundary (`no-restricted-imports` in [eslint.config.js](eslint.config.js), tested in [scripts/lint-rules.test.mjs](scripts/lint-rules.test.mjs)), and the domain package's `rootDir` makes tsc fail on a relative import out of `src/`. ESLint also stops `apps/mobile` importing `@rcp/api` or a path into `api/src`, tested in the same file. `apps/api` has nothing to fence yet: it may import the domain and any package.

## Invariants
- `packages/domain` imports nothing outside its own `src/` but zod: ESLint `no-restricted-imports`, and tsc's `rootDir`.
- No test is skipped or focused in committed code: ESLint, `vitest/no-disabled-tests` and `vitest/no-focused-tests`.
- `apps/mobile` never imports `apps/api`'s code: ESLint `no-restricted-imports`.
- The app keeps the API token only in `expo-secure-store`, and sends it only in the `Authorization` header to an `https://` address (http only in development builds), and only to the address it was saved for: `apps/mobile/src/connection/`, tested there.
- Every API route except `/healthz` sits under `/api` and needs the bearer token: Hono's `bearerAuth` on `/api/*` in `apps/api/src/app.ts`, tested in `app.test.ts`, including an unknown route. The recipe routes check it too, tested in `recipes.test.ts`.
- Every request body and query goes through a `@rcp/domain` schema before the API uses it, and every path id through `idParam` in `app.ts`. The schemas are strict, so unknown fields are rejected. A failure answers 400 with the field paths, never the input. Tested in `recipes.test.ts`.
