# Agent-ready repository template

A starting point for a new repository where coding agents (Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI, Cursor) do much of the work, locally and in CI. It holds no application code and assumes no stack: the docs and agent config are stack-neutral, and the checks are Node scripts with no dependencies, so a project needs Node 22 or later whatever its own stack.

This page is the template's introduction. GitHub shows it in place of the root `README.md`, which belongs to the new project. Delete this file when the bootstrap plan is done.

## Start
1. Click **Use this template** on GitHub, or copy the contents into an empty folder and run `git init -b main`.
2. Install Node 22 or later (`.nvmrc` pins 24), then run `npm run setup` to enable the git hooks.
3. Run `npm run verify`. It passes, warns that the checks cover the template rather than the project, and warns about each `TODO(template)` placeholder left to fill in. Once the bootstrap plan is finished, a placeholder fails the check.
4. Commit and push. On GitHub, protect `main`: require the `verify` and `secrets` CI checks and one approving review, and turn on "Do not allow bypassing the above settings" so the rules bind admins too. Working alone, require the checks but not the review: nobody else can approve your pull requests. GitHub Free offers branch protection only for public repositories. Under Settings → Advanced Security, turn on Dependabot alerts, Dependabot security updates, and secret scanning with push protection (free for public repositories). Create the `ready-for-agent` label that tickets use ([docs/AGENT_TOOLS.md](../docs/AGENT_TOOLS.md)).
5. Optional: switch on the Claude workflows, the Copilot coding agent and Codex cloud, as [docs/AGENT_TOOLS.md](../docs/AGENT_TOOLS.md) describes.
6. Ask your coding agent to "resume the bootstrap exec plan". The [plan](../docs/exec-plans/active/bootstrap.md) has it interview you, remove the agents you don't use, set up the stack, and fill in the placeholders.

## What's in the box
| Path | What it does |
| :-- | :-- |
| `AGENTS.md` | The map every agent reads first: which doc for which task, commands, boundaries, review guidelines. The doc checks keep it under 100 lines |
| `CLAUDE.md`, `.claude/` | Claude Code: imports AGENTS.md; permissions, sandbox, guard hook, reviewer subagent, mirrored skills |
| `.codex/` | Codex: sandbox and approval settings, guard hook |
| `.gemini/`, `.geminiignore`, `.cursorignore`, `.github/copilot-instructions.md` | Gemini CLI, Cursor and Copilot: point to AGENTS.md and keep secrets out of context |
| `.agents/skills/` | Shared on-demand procedures: exec plans and their tickets, doc gardening, bug diagnosis, retros |
| `REVIEW.md` | What AI and human reviewers report (P0/P1 only) and skip |
| `ARCHITECTURE.md`, `docs/` | The system of record: core beliefs, plans, style, testing, security, agent tools, the knowledge-base rules |
| `docs/exec-plans/` | Exec plans, starting with the bootstrap plan, and the tech-debt tracker |
| `scripts/` | Doc checks, tracked-file and machine-detail checks, the skills mirror, the agent guard hook, setup; each with tests |
| `.githooks/pre-commit` | Runs the fast checks, plus gitleaks when installed |
| `.github/workflows/` | CI (`npm run verify` on Linux, Windows and macOS, and gitleaks), Copilot setup steps, opt-in Claude mention and review workflows |
| `.gitleaks.toml`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, `.nvmrc` | Secret scanning, ignores, LF line endings, editor defaults, env variable names, Node version |

## Known limits
- The checks need Node 22 or later, whatever the project's own stack.
- Hooks and permission rules stop an agent's mistakes, not a determined attacker. [SECURITY.md](../docs/SECURITY.md#boundaries-and-what-enforces-them) says what each boundary rests on, and the [tech-debt tracker](../docs/exec-plans/tech-debt-tracker.md) lists the gaps.
- The merge boundary is GitHub's branch protection, which step 4 switches on. GitHub Free offers it only for public repositories.
- On native Windows, Claude Code runs commands outside its sandbox; the permission rules and the guard hook still apply.
- `npm run verify` checks the template's own tooling until the bootstrap plan adds the project's lint, typecheck and tests.

## Why it is built this way
Each choice follows a practice reported by the teams and vendors that run agents at scale. The reasons are in [core beliefs](../docs/design-docs/core-beliefs.md); in short:

| Practice | Where it lives here | Source |
| :-- | :-- | :-- |
| A short entry file that maps into a docs system of record, instead of one big instruction file | `AGENTS.md`, `docs/`, the 100-line check | [OpenAI, Harness engineering](https://openai.com/index/harness-engineering/); [Claude Code memory docs](https://code.claude.com/docs/en/memory) |
| One instruction file shared by every tool | `AGENTS.md`, imported by `CLAUDE.md`, pointed to by Gemini and Copilot | [agents.md](https://agents.md/) |
| Exact commands near the top, and Always / Ask first / Never boundaries | AGENTS.md | [GitHub, lessons from 2,500 agent files](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) |
| One command the agent runs to verify its own work, with error messages that say how to fix | `npm run verify`, the scripts' messages | [Claude Code best practices](https://code.claude.com/docs/en/best-practices); [Böckeler, Harness engineering](https://martinfowler.com/articles/harness-engineering.html) |
| Must-never rules enforced by hooks, permissions and sandboxes, not prose | guard hook, `.claude/settings.json`, `.codex/` | [Extend Claude Code](https://code.claude.com/docs/en/features-overview); [Codex hooks](https://learn.chatgpt.com/docs/hooks) |
| Plans committed before code for multi-session work | `docs/PLANS.md`, exec-plan skill | [OpenAI, ExecPlans](https://developers.openai.com/cookbook/articles/codex_exec_plans) |
| Parallel work split into vertical-slice tickets with blocking edges, while decisions stay in the repo | `docs/PLANS.md`, exec-plan skill, GitHub Issues | [Pocock, to-tickets](https://aihero.dev/skills-to-tickets) |
| Repeated agent mistakes turned into checks, at the highest level that holds, with each boundary paired with its enforcer | retro skill, the boundaries table in `docs/SECURITY.md` | [pstack, correct](https://github.com/backnotprop/pstack/blob/main/skills/correct/SKILL.md); [Pocock, retro](https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md) |
| Custom checks tested against the real mistake, and checks at edit time only for findings with a reliable fix | `docs/CODE_STYLE.md` | [Semgrep, testing rules](https://docs.semgrep.dev/writing-rules/testing-rules); [Semgrep Guardian rules](https://docs.semgrep.dev/semgrep-guardian/rules-and-configuration) |
| Open design choices settled by interviewing the user in rounds, each question with a recommended answer, and recorded in the plan and docs | exec-plan skill | [Pocock, grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) |
| Bugs fixed from a check that fails on them, not from a theory, with the check kept as a regression test | diagnosing-bugs skill | [Pocock, diagnosing-bugs](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md) |
| A scripted way for agents to drive the real app and keep the evidence | `docs/TESTING.md`, the bootstrap plan | [pstack, create-verification-skill](https://github.com/backnotprop/pstack/blob/main/skills/create-verification-skill/SKILL.md) |
| Design docs only for decisions that are hard to reverse, surprising and a real trade-off | `docs/design-docs/index.md` | [Pocock, ADR format](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/ADR-FORMAT.md) |
| Fresh-context review tuned to P0/P1 findings | `REVIEW.md`, reviewer subagent, review workflow | [Codex code review](https://learn.chatgpt.com/docs/third-party/github); [Claude Code review](https://code.claude.com/docs/en/code-review) |
| Context loaded on demand | skills, nested AGENTS.md, docs linked from the map | [Böckeler, context engineering](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) |
| A reproducible environment for cloud agents | `copilot-setup-steps.yml`, `npm ci` with a committed lockfile | [GitHub Docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment) |
| CI agents that never see untrusted text and secrets together | `claude-review.yml` prompt, fork and bot skips, write-access only | [Aikido, PromptPwnd](https://www.aikido.dev/blog/promptpwnd-github-actions-ai-agents); [Willison, lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) |
| Docs kept true by checks and a recurring gardening pass | `scripts/check-docs.mjs`, doc-gardening skill | [OpenAI, Harness engineering](https://openai.com/index/harness-engineering/) |
| Secrets and machine details kept out of git | tracked-files check, gitleaks, `.gitignore` | [GitGuardian, secrets sprawl 2026](https://www.gitguardian.com/state-of-secrets-sprawl-report-2026) |

## License
[Apache License 2.0](../LICENSE). The diagnosing-bugs skill and the interview in the exec-plan skill are adapted from Matt Pocock's MIT-licensed skills and carry his notice. A project made from the template chooses its own license in the bootstrap plan.
