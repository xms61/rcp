---
status: draft
last-verified: 2026-10-15
---

# Architecture

RCP is an Android app (React Native with Expo) for its owner's phone. It talks over HTTPS to a small TypeScript API on the owner's VPS, which holds the recipes and food data in one SQLite file. Nutrition is computed from each recipe's ingredients ([design doc](docs/design-docs/nutrition-from-ingredients.md)). Why this shape: [an Android app with the data on the VPS](docs/design-docs/mobile-app-and-api.md). The [migration plan](docs/exec-plans/active/2026-10-15-mobile-migration.md) is building the app and the API; until it lands, only the domain package exists.

## Code map
| Path | Holds |
| :-- | :-- |
| `packages/domain/` | `@rcp/domain`: recipe logic in plain TypeScript, such as converting amounts to grams, for both the app and the API |
| `apps/api/` | Not created yet: the Hono API on the VPS, with the database and the food imports |
| `apps/mobile/` | Not created yet: the Expo app for Android |
| `scripts/` | Repo tooling: the doc and tracked-file checks, the lint-rule tests, the agent guard hook, setup |
| `docs/` | The system of record ([KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md)) |

## Layers
`apps/mobile → apps/api → packages/domain`, over HTTP for the first arrow and imports for the second; `apps/mobile` may import `packages/domain` too.
- `packages/domain` imports nothing but its own files: no packages, Node APIs or apps. So it runs unchanged on the phone and on the server, and its tests need no setup.
- `apps/api` owns the database and every I/O on the server. The app reaches data only through it.
- `apps/mobile` never imports `apps/api`'s code; it calls its HTTP routes.

ESLint enforces the domain boundary (`no-restricted-imports` in [eslint.config.js](eslint.config.js), tested in [scripts/lint-rules.test.mjs](scripts/lint-rules.test.mjs)), and the domain package's `rootDir` makes tsc fail on a relative import out of `src/`. When the apps are created, add their boundaries and test cases in the same change.

## Invariants
- `packages/domain` imports nothing outside its own `src/`: ESLint `no-restricted-imports`, and tsc's `rootDir`.
- No test is skipped or focused in committed code: ESLint, `vitest/no-disabled-tests` and `vitest/no-focused-tests`.
