---
status: draft
last-verified: 2026-10-15
---

# An Android app with the data on the owner's VPS

## Context
RCP started as a web app on one local Node server ([bootstrap plan](../exec-plans/completed/bootstrap.md)). On 2026-10-15 the owner changed it to a pure mobile app, used on their own Android phone, with the recipes and food data kept on their Hetzner VPS so they take no space on the phone. The interview is logged in the [migration plan](../exec-plans/active/2026-10-15-mobile-migration.md).

## Decision
- **The app** is React Native with Expo (Expo Router, TypeScript), for Android only. It is installed only on the owner's devices, from an APK built locally with Gradle; development runs in Expo Go.
- **The data** lives on the VPS: one SQLite file behind a small TypeScript API (Hono on Node 24, Drizzle with better-sqlite3). The phone stores no recipe database, only a cache of recently opened recipes, so the one being cooked stays readable when the connection drops. Editing needs the server.
- **Access** is public HTTPS with one long-lived API token. The server reads it from its `.env`; the owner pastes it into the app once, which keeps it in the phone's secure storage and sends it on every request.
- **Hosting** follows BeanQuery's deploy on the same VPS: an image in GHCR published by a hand-started release workflow, `/opt/rcp/compose.yml` on the shared `edge` network with no public port, a site file for ysto's Caddy, and a nightly systemd backup that stays on the VPS. GitHub holds no VPS credentials.
- **The code** is one pnpm workspace: `apps/mobile`, `apps/api`, and `packages/domain` for logic both use, such as unit conversion and nutrition sums.

## Why
A server-held database keeps the phone light and makes the food tables (USDA, CIQUAL, BLS) a server concern: they are imported and queried there, not shipped in the APK. One user needs no accounts, so a single token is enough, and it is simple to rotate. Reusing the VPS's existing Caddy, network and runbook adds one site to a setup the owner already runs. Expo keeps the React and TypeScript tooling, and the domain code, from the web setup.

Rejected:
- Recipes on the phone, with backup or sync: the owner wants the data off the phone.
- PocketBase or self-hosted Supabase in front of the database: less code, but the imports and nutrition maths would live outside them, and Supabase is heavy for one user.
- Tailscale instead of public HTTPS: no login to build, but the phone would need the VPN running.
- Flutter or native Kotlin: everything, tooling included, would be rewritten.
- EAS cloud builds: no Android SDK needed locally, but the owner prefers building on their own PC.

## Consequences
- The app is useless without the API, except for the cache. The API needs an uptime check from the owner's side; there is no monitoring yet.
- A leaked token gives full access until it is rotated. It never goes in the repo, a log, or a URL.
- Building the APK needs Android Studio, with its SDK and JDK 17, on the owner's PC.
