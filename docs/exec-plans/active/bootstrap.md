# Bootstrap the repository from the template

## Purpose
Turn the template into this project's repository: the stack chosen and set up, `npm run verify` running the stack's checks locally and in CI, the docs describing this project instead of placeholders, and only the agents the team uses configured. Done when `npm run check:docs` reports no template placeholders and CI is green.

## Context
- [AGENTS.md](../../../AGENTS.md): the commands table and boundaries to fill in.
- [AGENT_TOOLS.md](../../AGENT_TOOLS.md): how Claude Code, the one agent kept, is set up.
- [ARCHITECTURE.md](../../../ARCHITECTURE.md), [CODE_STYLE.md](../../CODE_STYLE.md), [TESTING.md](../../TESTING.md), [SECURITY.md](../../SECURITY.md): the docs with `TODO(template)` placeholders.
- `npm run check:docs` lists every placeholder left, by file and line.

## Plan
1. Interview the owner as the [exec-plan skill](../../../.claude/skills/exec-plan/SKILL.md) describes, covering: what the project does and for whom; the stack and runtime; where it will run; which coding agents the team uses; whether AI review should run in CI; the license; and how many people will work on it. Record the answers in the Decision log.
2. Remove the agents the team doesn't use.
3. `LICENSE` holds the project's license; the template's Apache 2.0 text stays in `LICENSES/Apache-2.0.txt`, because Apache 2.0 asks that copies of the template's files come with it. If more than one person will work on it, add `.github/CODEOWNERS` and require code-owner review ([SECURITY.md](../../SECURITY.md#agents-in-ci)).
4. Set up the stack: dependencies, formatter, linter, typecheck and test runner, with one passing test. Fill in the AGENTS.md commands table, add the checks to the `verify` script, and add `cache: npm` to both setup-node steps in CI once there are dependencies.
5. Cloud agents: none are used (Decision log), so there is no cloud setup script to update.
6. Fill in README.md, ARCHITECTURE.md and the Stack sections of CODE_STYLE.md and TESTING.md. Once there are two layers, enforce the dependency direction with a lint rule or a structural test.
7. Once the app has a user-facing feature, write its verification skill ([TESTING.md](../../TESTING.md#verification-skill)) and prove it on that feature. If the app has no feature yet, add a tech-debt row instead, so the skill is written with the first feature.
8. Replace the remaining placeholders, including how to report a vulnerability in SECURITY.md, then delete `.github/README.md`, the template's introduction, which GitHub shows in place of the project's README.

## Progress
- [ ] Owner interviewed, answers logged (partly: purpose, web app, agents, CI review, license and team size are logged; framework, data store and hosting are open)
- [x] Unused agents removed (2026-10-14)
- [x] License added; no CODEOWNERS, one person works here (2026-10-14)
- [ ] Stack set up; `verify` runs lint, typecheck and tests
- [x] Cloud agent setup updated (not applicable: no cloud agents)
- [ ] README.md, ARCHITECTURE.md, CODE_STYLE.md and TESTING.md filled in (README.md done)
- [ ] Verification skill written and proven on one feature, or deferred with a tech-debt row until the first user-facing feature
- [ ] No template placeholders left; `.github/README.md` deleted

## Decision log
- 2026-10-14: The project is RCP, a personal recipe database that tracks recipes with their ingredient lists, steps, nutrients and similar details. The owner is its user.
- 2026-10-14: The template was laid over the existing private repository `xms61/rcp` instead of creating a new one, keeping its initial commit. That commit's Go `.gitignore` and one-line README were replaced by the template's; no Go code depends on them.
- 2026-10-14: Claude Code is the only coding agent. Codex, Copilot, Gemini CLI and Cursor config were removed, and the skills live in `.claude/skills/` as the source, without the `.agents/skills/` mirror and its sync script.
- 2026-10-14: No AI agents in CI. The owner won't use the Claude workflows, which need an `ANTHROPIC_API_KEY` secret, so `claude.yml` and `claude-review.yml` were removed. Review stays local, with the `reviewer` subagent.
- 2026-10-14: License: the repository's existing MIT license stays in `LICENSE`; the template's Apache 2.0 text moved to `LICENSES/Apache-2.0.txt`.
- 2026-10-14: One person works on it, so no CODEOWNERS and no required review in branch protection.
- 2026-10-14: RCP is a web app. The framework, data store and hosting are still open.
- 2026-10-14: CI runs `npm run verify` on Linux only. The template's `verify-other-os` job (Windows and macOS) was removed: the owner doesn't need checks on other systems for a web app.

## Surprises
- 2026-10-14: `xms61/rcp` already existed (private, created 2023) with an MIT license, a Go `.gitignore` and a one-line README.

## Validation
`npm run verify` passes with the stack's checks included, `npm run check:docs` prints no placeholder warnings, and CI is green on the pull request that finishes this plan. Once this plan moves to `completed/`, any placeholder left fails the doc checks.

## Outcome
Filled in when the plan moves to completed/.
