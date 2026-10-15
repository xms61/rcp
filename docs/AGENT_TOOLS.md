---
status: draft
last-verified: 2026-10-15
---

# Agent tools

Claude Code is the only coding agent set up in this repo. It reads [AGENTS.md](../AGENTS.md) through the import in [CLAUDE.md](../CLAUDE.md) (an import instead of a symlink, because symlinks break on Windows checkouts); the files below add guardrails and procedures. To scope rules to one folder, add a nested `AGENTS.md` in that folder rather than a tool-specific rules file.

## Files
| File | Purpose |
| :-- | :-- |
| [.claude/settings.json](../.claude/settings.json) | Shared permissions, sandbox and the guard hook. Personal overrides go in `.claude/settings.local.json`, which git ignores |
| [.claude/agents/reviewer.md](../.claude/agents/reviewer.md) | Fresh-context review subagent, which reports by [REVIEW.md](../REVIEW.md) |
| [.claude/agents/security-reviewer.md](../.claude/agents/security-reviewer.md) | The second review, for security only, after `reviewer` on any change to code, dependencies, deploy files or agent and CI config. Its checklist follows the OWASP Top 10:2025, API Security Top 10:2023 and Mobile Top 10:2024, applied to RCP's token, API, image and Android app; update it when the threat model changes |
| `.claude/skills/` | Procedures loaded on demand: [exec-plan](../.claude/skills/exec-plan/SKILL.md), [doc-gardening](../.claude/skills/doc-gardening/SKILL.md), [diagnosing-bugs](../.claude/skills/diagnosing-bugs/SKILL.md), and [retro](../.claude/skills/retro/SKILL.md), which runs only when someone asks for it (`disable-model-invocation` in its frontmatter) |
| [scripts/agent-hooks/guard-tool-use.mjs](../scripts/agent-hooks/guard-tool-use.mjs) | Blocks edits to `.env`, keys, lockfiles and `.git/`, and commands that skip hooks, force-push or touch `.env` |

**Notes:** the sandbox works on macOS, Linux and WSL2; on native Windows, commands run unsandboxed and the permission rules and hook still apply.

## Tickets on GitHub Issues
Exec plans can split their milestones into GitHub issues ([PLANS.md](PLANS.md#tickets)). Sub-issues, blocked-by links and labels work on every GitHub plan, the free one included.

The label agents take work from is `ready-for-agent`; keep it out of issue templates ([SECURITY.md](SECURITY.md#tickets-and-untrusted-text)). To recreate it in a new repository:

```bash
gh label create ready-for-agent --color 0E8A16 --description "A ticket an agent may work on"
```

Claude Code uses the `gh` CLI, signed in with `gh auth login --with-token` and a fine-grained token limited to this repository ([SECURITY.md](SECURITY.md#tickets-and-untrusted-text)). It needs a version whose `gh issue create --help` lists `--parent` and `--blocked-by`. Claude Code's sandbox allows `github.com`.

## Not set up
Left out on purpose; the reasons are in the bootstrap plan's Decision log. The [template](https://github.com/xms61/agentic-repo-template) has the files to bring any of them back.
- **Claude GitHub workflows** (`@claude` in issues and AI review of pull requests in CI): they need an `ANTHROPIC_API_KEY` repository secret.
- **Other coding agents** (OpenAI Codex, GitHub Copilot, Gemini CLI, Cursor). Adding one means its own config, and moving the skills to `.agents/skills/` with a mirror into `.claude/skills/`, as the template does.

## Design tool
UI designs are made in Penpot through the Penpot MCP server (`mcp__penpot__*` tools), set up in the owner's Claude Code config rather than in this repo. Read its `high_level_overview` before using it.

## Optional additions
- **MCP servers:** add them in `.mcp.json` and give each the narrowest scope that works. Every server's tools cost context, and every server is code you run.
- **Agent telemetry:** to see sessions, cost and tool calls, Claude Code exports OpenTelemetry when `CLAUDE_CODE_ENABLE_TELEMETRY=1` and an OTLP endpoint are set. Put them in user or managed settings, not the repo, and leave prompt and tool-content logging off: it sends source code to the telemetry backend.
- **Harder verification gate:** a Claude Code `Stop` hook that runs `pnpm verify` blocks a turn from ending while checks fail. It is slower and costs more per session; add it when the agent often stops before verifying. Split the work by cost: a hook after each edit runs only fast checks whose findings have a clear fix ([CODE_STYLE.md](CODE_STYLE.md#custom-checks)), and the full `verify` runs once at `Stop`.
