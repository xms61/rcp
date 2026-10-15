# Migrate RCP to an Android app with an API on the VPS

## Purpose
RCP becomes an Android app on the owner's phone, talking to an API on their Hetzner VPS that holds the recipes and food data. When this plan is done, the owner can install an APK they built on their PC, paste their API token into it once, and see the app confirm it reached the API over HTTPS. The recipe features themselves come after, in their own plans.

## Context
- [Design doc: an Android app with the data on the owner's VPS](../../design-docs/mobile-app-and-api.md): the architecture this plan builds.
- [Design doc: nutrition computed from ingredients](../../design-docs/nutrition-from-ingredients.md): still holds; the computation runs on the server.
- [Bootstrap plan](../completed/bootstrap.md): the TanStack Start web stack this plan replaces, and the tooling it keeps (pnpm, ESLint, Prettier, TypeScript 6.0, Vitest, `pnpm verify`).
- BeanQuery's `docs/DEPLOY.md` (github.com/xms61/BeanQuery): the deploy pattern on the same VPS that milestone 4 copies, ysto's Caddy and the `edge` network included.
- Precondition for the APK in milestone 3: Android Studio on the owner's PC, which brings the Android SDK and JDK 17. The PC had JDK 18 and no SDK on 2026-10-15.

## Plan
1. **Workspace.** Turn the repo into a pnpm workspace with `apps/` and `packages/`. Move `toGrams` and its test to `packages/domain`, remove the TanStack Start app and its dependencies, and keep `pnpm verify` green. Check: `pnpm verify` passes, and `pnpm test` runs the domain test from the package.
2. **API skeleton** in `apps/api`: Hono on Node 24, `GET /healthz` without auth, every other route behind the bearer token from `RCP_API_TOKEN`, compared in constant time. Vitest tests call the app through Hono's request API. A Dockerfile builds a small, read-only image. Check: tests for a missing, wrong and right token; `docker build` succeeds; the container answers `/healthz`.
3. **App skeleton** in `apps/mobile`: Expo with Expo Router and TypeScript. One screen takes the API address and token, keeps them in secure storage, and shows whether `/healthz` and an authenticated call succeed. jest-expo with React Native Testing Library tests it. Check: the tests pass in `pnpm verify`, the app runs in Expo Go against a local API, and a release APK built with Gradle (`pnpm --filter @rcp/mobile android`) installs and connects. A debug build won't do: it loads its code from the PC and allows http.
4. **Deploy** as BeanQuery does: `deploy/compose.yml` on `edge`, `deploy/rcp.caddy`, `deploy/.env.example`, a release workflow that publishes `ghcr.io/xms61/rcp` when started by hand, and `docs/DEPLOY.md`. Check: the owner runs the runbook, and `curl https://<domain>/healthz` answers from the VPS. The backup timer comes with the database.
5. **Docs**: ARCHITECTURE.md, CODE_STYLE.md, TESTING.md, AGENTS.md commands, SECURITY.md (the token), and the verification skill's tech-debt row, updated per milestone as each lands.

## Progress
- [x] 2026-10-15 Workspace: domain package, web app removed
- [x] 2026-10-15 API skeleton with token auth and image
- [ ] App skeleton that stores the token and reaches the API; APK installed
- [ ] Deployed on the VPS behind ysto's Caddy
- [x] 2026-10-15 Docs describe the mobile app and API. DEPLOY.md stays `draft` until its first run on the VPS

## Decision log
- 2026-10-15: RCP is a pure mobile app, for Android only, replacing the TanStack Start web app. Rejected: iOS (needs a Mac or cloud builds and a paid developer account).
- 2026-10-15: React Native with Expo, because it keeps React, TypeScript and the existing tooling. Rejected: Flutter and native Kotlin (full rewrite).
- 2026-10-15: The data lives on the owner's Hetzner VPS, not on the phone, to keep the phone light. The app caches recently opened recipes for offline reading only. Rejected: on-device storage with backup or sync, server-only with no cache, full offline editing.
- 2026-10-15: A small TypeScript API (Hono on Node 24, Drizzle with better-sqlite3) runs on the VPS. Rejected: PocketBase, self-hosted Supabase.
- 2026-10-15: Public HTTPS with one long-lived API token kept in the phone's secure storage. Rejected: Tailscale-only access, username and password, OAuth.
- 2026-10-15: Deploy as BeanQuery does: GHCR image from a hand-started release workflow, compose on the `edge` network behind ysto's Caddy. Rejected: building on the VPS.
- 2026-10-15: Backups stay on the VPS (a nightly local copy, as BeanQuery's), by the owner's choice: a lost server loses them too.
- 2026-10-15: The APK is built locally with Gradle and installed only on the owner's devices; development uses Expo Go. Rejected: EAS cloud builds, store publishing.
- 2026-10-15: One pnpm workspace: `apps/mobile`, `apps/api`, `packages/domain`. Vitest tests the domain and API, jest-expo the app.
- 2026-10-15: The API runs with `tsx` in development and is bundled by esbuild for its image, approved with Hono and `@hono/node-server`. The image needs no `node_modules`, and imports keep no file extensions. Rejected: compiling with tsc as BeanQuery does, which needs `.js` extensions on every import and a built domain package.
- 2026-10-15: Every route except `/healthz` sits under `/api` behind Hono's `bearerAuth`, which compares in constant time.
- 2026-10-15: UI designs are made in Penpot through its MCP server, the owner's choice; the app's screens follow those designs once they exist.
- 2026-10-15: The API's service on `edge` is named `rcp`, not `api`, because service names on a shared Docker network share one DNS namespace with the other apps'. Caddy adds HSTS for the site, since the API sets no headers itself. The release workflow is BeanQuery's, building `apps/api/Dockerfile`; CI gained a `workflow_call` trigger so the release can rerun it.
- 2026-10-15: The app starts from Expo's blank-typescript template (SDK 57) with Expo Router, `expo-secure-store`, jest-expo and React Native Testing Library, approved by the owner. Its Android id is `com.xms61.rcp`, its link scheme `rcp`, and backups are off. The address and token are saved only once the API accepts them. The template's `.claude/settings.json`, which turned on an Expo plugin for Claude Code, was dropped as unrequested agent config; its AGENTS.md was rewritten for RCP (local Gradle builds, not EAS).

## Surprises
- 2026-10-15: Hono's `bearerAuth` answers 400, not 401, to an `Authorization` header in another scheme (`Basic …`); the API test asserts that.
- 2026-10-15: pnpm blocked esbuild's install script until `allowBuilds` listed it in `pnpm-workspace.yaml`.
- 2026-10-15: `expo install` asked for Expo patches published the night before, and pnpm 12 answered by adding a `minimumReleaseAgeExclude` list for eleven packages to `pnpm-workspace.yaml`, then refused the lockfile once the list was removed. The fix: restore main's lockfile, loosen the ranges to `~57.0.0`, and install again, which resolves patches at least a day old (expo 57.0.28). `expo install --check` asks for the newer patches until they age past a day.
- 2026-10-15: React Native Testing Library 14 made `render` and every interaction async, and prefers `aria-*` props; `role="textbox"` doesn't typecheck on a React Native `TextInput`.
- 2026-10-15: The first security review found that the screen sent the saved token to any address typed in with an empty token field, and that Expo's libraries added four unused Android permissions. The saved token is now tied to its address, with a test, and `app.json` blocks the permissions. The general review found the documented APK command built a debug build, which allows http; `android` now builds the release variant.
- 2026-10-15: Claude Code reads nested `CLAUDE.md` files but not `AGENTS.md`, so `apps/mobile/CLAUDE.md` imports the app's AGENTS.md; the doc checks treat both as docs, with frontmatter.

## Validation
`pnpm verify` passes with all three parts' checks; the APK on the owner's phone shows a successful authenticated call to `https://<domain>` on the VPS.

## Outcome
Filled in when the plan moves to completed/.
