@AGENTS.md

## Claude Code
- Skills live in `.claude/skills/`. Claude Code is the only agent configured here, so there is no shared `.agents/skills/` copy.
- Before you call a non-trivial change done, have the `reviewer` subagent review the diff in a fresh context.
- Shared permissions, sandbox and hooks are in `.claude/settings.json`. Personal overrides go in `.claude/settings.local.json`, which git ignores.
