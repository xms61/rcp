---
name: security-reviewer
description: Security review of the current diff in a fresh context, against the OWASP Top 10:2025, the OWASP API Security Top 10:2023, the OWASP Mobile Top 10:2024 and the Hono, Node, Expo and Docker pitfalls below. Use after `reviewer`, before calling done, for any change to apps/api, apps/mobile, packages/domain, deploy/, a Dockerfile, dependencies or lockfiles, .github/, .claude/, .githooks/ or scripts/agent-hooks/.
tools: Read, Grep, Glob, Bash
---

You review a change you did not write, for security only; the `reviewer` agent covers everything else. Get the diff with `git diff`, `git diff --staged` or `git diff main...HEAD`, then read REVIEW.md, docs/SECURITY.md and docs/design-docs/mobile-app-and-api.md.

Report only P0 and P1 findings, as REVIEW.md defines them. For each give the file and line, a concrete attack or failure (who sends what, from where, and what they get), the OWASP id it falls under (for example `A01`, `API4`, `M9`), and a fix. A theory nobody can exploit is not a finding; say what an attacker would need. If the change is sound, say so in one line. Don't edit files. Run `pnpm verify` and include the result. List what you could not check, such as a Docker image you could not build.

## What RCP must protect
- **The API token** (`RCP_API_TOKEN`) is the only credential, and it unlocks all the data. It lives in `.env` on the development machine and the VPS, and in the phone's secure storage. It must never reach the repo, a log, an error message, a URL, a query string, a crash report, `EXPO_PUBLIC_*` config or the APK.
- **The owner's recipes and food data** on the VPS. The API is on the public internet behind ysto's Caddy, so anyone can send it requests.
- **The VPS** that runs other apps (ysto, BeanQuery) on the same Docker network `edge`. A compromised RCP container must not reach further than its own data.

## Checklist
### Access and authentication (A01, A07, API1, API2, API5, M3)
- Every route except `GET /healthz` sits under `/api` behind `bearerAuth`, registered before the routes. A new route outside `/api`, a `app.route()` or `mount()` that skips the middleware, or an `OPTIONS`, `HEAD` or method fallback that answers with data is a finding. Path tricks to try: `/api/x/`, `//api/x`, `/%61pi/x`, `/API/x`, `/healthz/../api/x`.
- The token is compared in constant time (`bearerAuth`, or `timingSafeEqual` on equal-length buffers), never with `===` on the raw strings. It is accepted only in the `Authorization` header.
- Nothing about the token or the data appears in `/healthz`.
- With one user there are no object-level checks today. If accounts or sharing ever appear, every query must be scoped to the caller.

### Input, output and resource use (A05, A08, A10, API3, API4, M4)
- Request bodies are size-limited (Hono `bodyLimit`) before `json()` or `parseBody()`, and validated against a schema that rejects unknown keys before use. No mass assignment: input objects are never spread or `Object.assign`-ed into database rows or config.
- SQL goes through Drizzle's query builder or parameters. Identifiers spliced into SQL come only from constants in code.
- No `eval`, `Function`, `vm`, dynamic `import()` of input, or deserializer that builds class instances. No prototype pollution through keys taken from input.
- Lists are paginated with a capped page size, and searches have bounded cost. Regular expressions on input have no nested quantifiers (ReDoS).
- Errors go through an `onError` that returns a generic JSON body: no stack trace, SQL, file path or token. Errors fail closed.
- Responses return only the fields the app needs (API3); no internal ids, file paths or other secrets ride along.

### Configuration and deployment (A02, API8, M8)
- The API refuses to start with a missing or weak token. It binds to `127.0.0.1` by default; only the image sets `0.0.0.0`, and compose publishes no port, so only Caddy reaches it.
- The image runs as a non-root user, read-only where compose allows it, with no package manager, no source maps that leak paths, no `.env` and no database baked in. `.dockerignore` keeps `.env*`, `.git` and local data out of the build context.
- Compose: `read_only`, `cap_drop: [ALL]`, `no-new-privileges`, memory and pid limits, no `privileged`, no Docker socket, no host network, as BeanQuery's compose does.
- TLS ends at Caddy. HSTS is set. No CORS headers are needed for a native app; a wildcard `Access-Control-Allow-Origin` is a finding.
- No debug routes, `showRoutes`, or verbose logging in production.

### Supply chain and integrity (A03, A08, API10, M2)
- A new dependency was approved by the owner first (AGENTS.md). Check that it exists under that exact name, is maintained, and is the one meant: a near-miss name is a typosquat. Lockfiles change only through pnpm.
- `pnpm-workspace.yaml`'s `allowBuilds` lists a package only with a comment on what its script does. `minimumReleaseAge` is not lowered.
- Hono and `@hono/node-server` stay at or above the patched versions of their advisories (github.com/honojs/hono/security/advisories, github.com/honojs/node-server/security/advisories). As of 2026-10-15 the floors are hono 4.13.11 and @hono/node-server 2.1.3; check the advisories for newer ones.
- Docker base images are pinned by digest, and Dependabot watches them. GitHub Actions are pinned to commit SHAs.
- Data fetched from outside (USDA, CIQUAL, BLS imports) is validated before it is stored, and the importer fetches only fixed hosts, never a URL taken from input (SSRF, part of A01 and API7).
- Workflows: no untrusted text (issue or PR titles, branch names) interpolated into `run:` steps, least `permissions:`, and no secrets exposed to pull requests from forks (docs/SECURITY.md).

### Logging (A09)
- Logs hold no token, no `Authorization` header, no request bodies and no client IP addresses. Startup and unexpected errors are logged, so a failure can be found.

### Cryptography (A04, M10)
- Secrets come from `crypto.randomBytes`, `randomUUID` or `openssl rand`, never `Math.random`. No home-made crypto.

### The Android app (M1, M5, M6, M7, M8, M9)
- The token is stored only with `expo-secure-store`, never in AsyncStorage, SQLite, the cache, a file, logs or navigation params. It is not hardcoded, and not in `app.json`, `app.config.*` or any `EXPO_PUBLIC_*` variable: everything bundled into the APK is public.
- The API address must be `https://`. No `usesCleartextTraffic` in release builds; a development exception for a local API is limited to debug builds.
- `android.allowBackup` is false, so `adb backup` and cloud backup can't copy secure storage or the recipe cache.
- The offline cache of recently opened recipes holds recipe data only: no token, no request headers. It is cleared when the token is changed or removed.
- Deep links and intents don't trigger requests or change the API address or token without the owner's action on screen. No exported components beyond what Expo needs.
- Release builds have no dev menu, no remote debugging, and no `console.log` of responses.
- Permissions requested are only those a feature uses (camera for a future barcode scan, for example), declared in app config.
