---
status: draft
last-verified: 2026-10-14
---

# Testing

## Principles
- Test first: write or update the test, watch it fail for the right reason, then make it pass. A test that has never failed proves nothing.
- `pnpm verify` runs every check a change must pass, locally and in CI. When it gets slow, add a fast subset for the edit loop; don't drop checks from `verify`.
- Tests never use the network or real user data. Use in-memory or temp-dir stores and stubs.
- Quiet on success, specific on failure: a failing test names the case and the expected and actual values. Thousands of lines of passing output bury the one line an agent needs.
- Never weaken, skip or delete a failing test to get green. If the test is wrong, fix it in its own commit and say why in the PR.
- Test behavior, not implementation: call the code the way its users do and assert literal expected values. A test that would still pass if every function it calls returned nothing tests nothing.
- A behavior that a unit test can't reach (a UI flow, a deploy) gets an end-to-end check the agent can run itself, such as a browser test or a run of the [verification skill](#verification-skill).

## Stack
- **Vitest** runs `src/**/*.test.{ts,tsx}`, which sit next to the code they test: `pnpm test` for all of them, `pnpm test <path>` for one file. Its config ([vitest.config.ts](../vitest.config.ts)) is separate from `vite.config.ts`, so tests run without the TanStack Start plugin. There is no coverage threshold.
- Logic that needs no I/O goes in `src/domain/` ([ARCHITECTURE.md](../ARCHITECTURE.md#layers)) and is tested there with literal values.
- `verify` ends with `pnpm build`, which catches errors that only the production build shows.
- There are no browser or end-to-end tests yet. The first user-facing feature brings the [verification skill](#verification-skill), which drives the running app ([tech-debt tracker](exec-plans/tech-debt-tracker.md)).

## Proving behavior
When a change alters what a user sees or does, prove it on the running app, not on a proxy such as a passing build or the agent's own report.
- Use the real user path: the UI, the CLI or the public API, never internal setters or test-only endpoints.
- Capture the action and the state it led to, not only the final screen, and check the side effects: files written, rows stored, messages sent.
- Mock only where production already isolates the external system.
- A dry run or test mode proves only what you saw it skip. Check the files, network calls or git refs it touched instead of trusting its name.
- When a precondition is missing, the proof fails and says which. Never weaken the journey to make it pass.
- Keep the evidence (screenshots, transcripts, response bodies, exit codes) where the PR can point to it, and say in the PR what you could not check.

## Verification skill
Once the app runs, it gets a project skill, `.claude/skills/verify-<app>/`, that any agent follows to drive the real app the way a user does. Write it from what the repo shows (the dev command, existing browser or terminal harnesses, routes and commands) and ask only what the code can't answer. It has these sections, each with this repo's real commands and handles:
- **Launch:** the command that starts the app from an empty data directory, migrations and seed data included; the signal that it is ready to use, not only running; and how to stop it. Say whether two instances can run side by side; if not, drive only an instance this run started.
- **Doctor:** one read-only check that this instance is worth driving: the process is up, the build is the expected one, the port belongs to this run. Run it first, and again after any failed drive.
- **Drive:** how to act on the app through stable handles such as accessible names, data attributes, prompts and routes, never screen coordinates. Any helper script the skill ships is executable, and the skill shows how to call it.
- **Evidence:** what to capture for each proof, and where it goes.
- **Cleanup:** stop what the run started, never by process name, and keep the evidence.
- **Feature map:** `features/README.md` indexes the user-facing features, one file each, with the sections Sub-features, How to get to it (user POV), Driving it, and Gotchas.

Prove the skill once before relying on it: launch, doctor, drive one feature, capture evidence, clean up, and check that the evidence is still there. The [doc-gardening pass](../.claude/skills/doc-gardening/SKILL.md) drives every feature in the map again and fixes the skill where it has drifted. A library can skip the skill: its tests already call it the way its users do.

## Repo scripts
The checks in `scripts/` have their own tests, next to each script as `*.test.mjs`, run by `pnpm test:scripts` (Node's built-in test runner). The rules that [eslint.config.js](../eslint.config.js) adds are tested there too, in `scripts/lint-rules.test.mjs`. They build their fixtures in temp directories. CI runs `pnpm verify` on Linux only, as the required check: RCP is a web app, so nothing is tested per operating system.
