# Bootstrap the repository from the template

## Purpose
Turn the template into this project's repository: the stack chosen and set up, `pnpm verify` running the stack's checks locally and in CI, the docs describing this project instead of placeholders, and only the agents the team uses configured. Done when `pnpm check:docs` reports no template placeholders and CI is green.

## Context
- [AGENTS.md](../../../AGENTS.md): the commands table and boundaries to fill in.
- [AGENT_TOOLS.md](../../AGENT_TOOLS.md): how Claude Code, the one agent kept, is set up.
- [ARCHITECTURE.md](../../../ARCHITECTURE.md), [CODE_STYLE.md](../../CODE_STYLE.md), [TESTING.md](../../TESTING.md), [SECURITY.md](../../SECURITY.md): the docs with `TODO(template)` placeholders.
- `pnpm check:docs` lists every placeholder left, by file and line.

## Plan
1. Interview the owner as the [exec-plan skill](../../../.claude/skills/exec-plan/SKILL.md) describes, covering: what the project does and for whom; the stack and runtime; where it will run; which coding agents the team uses; whether AI review should run in CI; the license; and how many people will work on it. Record the answers in the Decision log.
2. Remove the agents the team doesn't use.
3. `LICENSE` holds the project's license; the template's Apache 2.0 text stays in `LICENSES/Apache-2.0.txt`, because Apache 2.0 asks that copies of the template's files come with it. If more than one person will work on it, add `.github/CODEOWNERS` and require code-owner review ([SECURITY.md](../../SECURITY.md#agents-in-ci)).
4. Set up the stack: dependencies, formatter, linter, typecheck and test runner, with one passing test. Fill in the AGENTS.md commands table, add the checks to the `verify` script, and add `cache: pnpm` to the setup-node step in CI once there are dependencies.
5. Cloud agents: none are used (Decision log), so there is no cloud setup script to update.
6. Fill in README.md, ARCHITECTURE.md and the Stack sections of CODE_STYLE.md and TESTING.md. Once there are two layers, enforce the dependency direction with a lint rule or a structural test.
7. Once the app has a user-facing feature, write its verification skill ([TESTING.md](../../TESTING.md#verification-skill)) and prove it on that feature. If the app has no feature yet, add a tech-debt row instead, so the skill is written with the first feature.
8. Replace the remaining placeholders, including how to report a vulnerability in SECURITY.md, then delete `.github/README.md`, the template's introduction, which GitHub shows in place of the project's README.

## Progress
- [x] Owner interviewed, answers logged (2026-10-14)
- [x] Unused agents removed (2026-10-14)
- [x] License added; no CODEOWNERS, one person works here (2026-10-14)
- [x] Stack set up; `verify` runs lint, typecheck and tests (2026-10-14)
- [x] Cloud agent setup updated (not applicable: no cloud agents)
- [x] README.md, ARCHITECTURE.md, CODE_STYLE.md and TESTING.md filled in (2026-10-14)
- [x] Verification skill written and proven on one feature, or deferred with a tech-debt row until the first user-facing feature (2026-10-14: deferred; the app has no feature yet)
- [x] No template placeholders left; `.github/README.md` deleted (2026-10-15)

## Decision log
- 2026-10-14: The project is RCP, a personal recipe database that tracks recipes with their ingredient lists, steps, nutrients and similar details. The owner is its user.
- 2026-10-14: The template was laid over the existing private repository `xms61/rcp` instead of creating a new one, keeping its initial commit. That commit's Go `.gitignore` and one-line README were replaced by the template's; no Go code depends on them.
- 2026-10-14: Claude Code is the only coding agent. Codex, Copilot, Gemini CLI and Cursor config were removed, and the skills live in `.claude/skills/` as the source, without the `.agents/skills/` mirror and its sync script.
- 2026-10-14: No AI agents in CI. The owner won't use the Claude workflows, which need an `ANTHROPIC_API_KEY` secret, so `claude.yml` and `claude-review.yml` were removed. Review stays local, with the `reviewer` subagent.
- 2026-10-14: License: the repository's existing MIT license stays in `LICENSE`; the template's Apache 2.0 text moved to `LICENSES/Apache-2.0.txt`.
- 2026-10-14: One person works on it, so no CODEOWNERS and no required review in branch protection.
- 2026-10-14: The repository is public, which is what keeps branch protection (required checks verify and secrets, admins included), secret scanning and push protection available on GitHub Free.
- 2026-10-14: RCP is a web app. The framework, data store and hosting are settled in the entries below.
- 2026-10-14: CI runs `verify` on Linux only. The template's `verify-other-os` job (Windows and macOS) was removed: the owner doesn't need checks on other systems for a web app.
- 2026-10-14: RCP runs as one Node server, on the owner's PC first, with no login. It may move to a home server or small VPS later for phone access, and gets a login then. Rejected: a home server from day one (a login needed now) and a serverless host (needs a hosted database, no local files).
- 2026-10-14: Framework: TanStack Start (React, TypeScript), the owner's pick: React is what agents know best, and routes, search params and server functions are type-checked end to end. Its 2025 betas changed the API a lot, so agents may write the old forms; typecheck catches most of them. Rejected: SvelteKit (agents are less fluent in Svelte 5), React Router 8 (looser route types), Next.js (heavier, at its best on Vercel).
- 2026-10-14: Data lives in one SQLite file, accessed through Drizzle ORM and better-sqlite3 (typed schema, generated migrations). Rejected: PostgreSQL (a server to run, for one user), recipe files in the repo (no queries across recipes), Kysely and plain `node:sqlite` (hand-written migrations and row types).
- 2026-10-14: Nutrition is computed from ingredients linked to foods from USDA FoodData Central, CIQUAL, BLS 4.0 and the owner's own entries, in metric plus kitchen measures; overlapping foods are kept and picked per ingredient; names are in English except brand names. Details and rejected options: [design doc](../../design-docs/nutrition-from-ingredients.md).
- 2026-10-14: pnpm is the package manager, the owner's call, pinned in `package.json` (`packageManager`), with its settings in `pnpm-workspace.yaml`. It replaces npm in the scripts, hooks, CI, agent permissions and docs. pnpm 12 skips versions published less than a day ago and blocks dependency build scripts not listed in `allowBuilds`.
- 2026-10-14: ESLint and Prettier for lint and format, with TypeScript held at 6.0: typescript-eslint supports TypeScript below 6.1 only. Move to TypeScript 7 when it does. Rejected: Biome (no TanStack router rules, fewer type-aware rules) and oxlint (custom-rule plugins still alpha, weaker on Windows). Vitest runs the tests, since the app already builds with Vite.
- 2026-10-15: Vulnerabilities are reported through GitHub's private vulnerability reporting, turned on for the repository, rather than a published email address.
- 2026-10-14: This plan stops at the framework, tooling and one test. The database, schema and food imports come with the first feature that stores recipes, in a new exec plan.

## Surprises
- 2026-10-14: `xms61/rcp` already existed (private, created 2023) with an MIT license, a Go `.gitignore` and a one-line README.
- 2026-10-14: `pnpm setup` is a pnpm built-in that edits the shell profile, so it never reaches the repo's `setup` script. The docs say `pnpm run setup`; every other script name is free.
- 2026-10-14: ESLint 10 loads an `eslint.config.ts` through `jiti`, which this repo gets only transitively (from TanStack's router generator), so the config is `eslint.config.js`.

## Validation
`pnpm verify` passes with the stack's checks included, `pnpm check:docs` prints no placeholder warnings, and CI is green on the pull request that finishes this plan. Once this plan moves to `completed/`, any placeholder left fails the doc checks.

## Outcome
Finished 2026-10-15. The repository is RCP's own: a TanStack Start app (React, TypeScript, pnpm) with ESLint, Prettier, TypeScript 6.0 and Vitest in `pnpm verify`, which CI runs on Linux as the required check ([#1](https://github.com/xms61/rcp/pull/1), [#2](https://github.com/xms61/rcp/pull/2)). Claude Code is the only agent, the docs describe the project, and no template placeholders are left. The owner's stack and data decisions are in the Decision log above and the [nutrition design doc](../../design-docs/nutrition-from-ingredients.md).

Validation: `pnpm verify` passes and `pnpm check:docs` prints no placeholder warnings.

Not done, as planned:
- The database (SQLite through Drizzle and better-sqlite3), the schema and the food imports. They need their own exec plan, which starts with the open questions in the design doc.
- The verification skill, until the first user-facing feature ([tech-debt tracker](../tech-debt-tracker.md)).
