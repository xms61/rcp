@AGENTS.md

## Claude Code
- Skills live in `.claude/skills/`. Claude Code is the only agent configured here, so there is no shared `.agents/skills/` copy.
- Before you call a non-trivial change done, have the `reviewer` subagent review the diff in a fresh context. Then, when the diff touches code, dependencies, deploy files or agent and CI config (the paths in its description), have the `security-reviewer` subagent review it too, and fix or answer its findings before opening or merging the PR.
- Shared permissions, sandbox and hooks are in `.claude/settings.json`. Personal overrides go in `.claude/settings.local.json`, which git ignores.
