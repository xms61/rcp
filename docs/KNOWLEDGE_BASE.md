---
status: draft
last-verified: 2026-10-14
---

# Knowledge base

How the docs in this repo are laid out, checked and kept true. The principles behind it are in [core beliefs](design-docs/core-beliefs.md).

## Layout
| Path | Holds | Written by |
| :-- | :-- | :-- |
| [AGENTS.md](../AGENTS.md) | The map: which doc to read for which task, the commands, the boundaries. Under 100 lines | Hand |
| [CLAUDE.md](../CLAUDE.md) | Imports AGENTS.md, plus the few notes only Claude Code needs | Hand |
| [REVIEW.md](../REVIEW.md) | What reviewers, human or AI, report and skip | Hand |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Code map, layers and invariants | Hand |
| `docs/*.md` | One doc per cross-cutting topic: style, testing, security, plans, agent tools | Hand |
| [docs/design-docs/](design-docs/index.md) | Technical decisions, listed in the folder's index | Hand |
| [docs/exec-plans/](PLANS.md) | Active and completed exec plans, and the tech-debt tracker | Hand, as the work happens |
| [CHANGELOG.md](../CHANGELOG.md), [docs/CHANGELOG-archive.md](CHANGELOG-archive.md) | Release notes: the latest five releases, and the older ones | Hand, at each release |
| [docs/AREA_DOC_TEMPLATE.md](AREA_DOC_TEMPLATE.md) | The starting point for an area doc | Hand, copied next to the code |
| `.claude/skills/` | Procedures agents load on demand ([AGENT_TOOLS.md](AGENT_TOOLS.md)) | Hand |
| `docs/scratch/` | Local notes; git ignores it | Anyone; never committed |

## Growing the docs
Add a doc when a topic needs rules that more than one change will rely on, not before. Common next docs:
- `docs/product-specs/` with an `index.md`, once there is user-facing behavior to pin down. The doc checks enforce its index like the design docs'.
- `docs/RELIABILITY.md` (errors, timeouts, logging), `docs/FRONTEND.md` and `docs/DESIGN.md` (UI), once that code exists.
- `docs/GLOSSARY.md`, once people or agents use the project's domain terms inconsistently. Each term gets one or two sentences on what it is and its rejected synonyms under `_Avoid_`, and nothing about how it is built; general programming terms stay out. Add a term in the change that settles it, and use the glossary's word in code, tickets and docs.
- `docs/references/` for a library's llms.txt or similar, copied from the source and not edited, when the library is newer than the models' training data.
- `docs/generated/` for reference that scripts produce, such as a database schema. Never edit it by hand.
- A nested `AGENTS.md` inside a folder whose code has its own rules. Every agent reads the closest one to the file it edits, so it loads only when that folder is touched.
- An area doc next to the code it describes, such as `server/db/DATABASE.md`, copied from [AREA_DOC_TEMPLATE.md](AREA_DOC_TEMPLATE.md), once an area's rules, data and gotchas outgrow a few lines. Give it a row in the AGENTS.md map.

Every new doc gets frontmatter, a row in the AGENTS.md map or a link from a related doc, and one owner topic that no other doc restates.

## Writing for agents
Most readers of these docs and skills are agents, and every line in AGENTS.md or a skill description is read in every session.
- A pointer decides when a doc gets read: a map row, a link or a skill description names what the doc holds and the situations that should send an agent to it, with the deciding word first.
- Delete sentences that change nothing an agent would do anyway. Whether a sentence matters is settled by running the agent without it, not by debate.
- Say what to do. Keep "never" for hard boundaries, and give each one an enforcer ([SECURITY.md](SECURITY.md#boundaries-and-what-enforces-them)).
- Don't copy what a file or command already shows, such as scripts, config or `--help` output; the copy goes stale. Write down what an agent can't find by looking: the reason behind a choice, an unwritten convention, a trap. The AGENTS.md commands table is the exception that earns its place, because every session needs it.
- End each step of a procedure on a result the agent can check, so it can tell done from not done.

## Doc metadata
Every hand-written doc starts with this frontmatter. Exceptions: the root entry files (AGENTS.md, CLAUDE.md, README.md, REVIEW.md, CHANGELOG.md), agent config under `.claude/` and `.github/`, and exec plans.

```md
---
status: draft
last-verified: YYYY-MM-DD
---
```

- `stub`: a skeleton with placeholders. Don't rely on it; fill it in once the code it describes exists.
- `draft`: written, but not checked against the code, or the code doesn't exist yet.
- `verified`: checked against the code on `last-verified`. For docs of principles, the owner confirmed it.

Set `last-verified` to today's UTC date (`date -u +%F`) whenever you check a doc against the code, including when a change makes you edit it.

## What the doc checks enforce
`pnpm check:docs` runs in `verify`, the pre-commit hook and CI, and fails on:
- a relative link to a file or folder that doesn't exist, in any Markdown file, skills and agent config included;
- a doc that can't be reached by following links from AGENTS.md (exec plans, generated and reference files are exempt);
- missing or invalid frontmatter, or a `last-verified` date more than a day ahead of UTC;
- a doc in `docs/design-docs/` or `docs/product-specs/` without a row in that folder's `index.md`, or a row whose status differs from the doc's;
- an exec plan without its required sections ([PLANS.md](PLANS.md));
- an AGENTS.md longer than 100 lines;
- after bootstrap, a template placeholder left anywhere, or the template's introduction left at `.github/README.md`.

It warns, without failing, about `verified` docs last verified more than 90 days ago. While the bootstrap plan is in `docs/exec-plans/active/`, it also warns that the checks cover the template rather than the project, and about each `TODO(template)` placeholder. Once that plan moves to `completed/`, a placeholder fails the check. The warnings are the gardening pass's first work.

## Doc gardening
A pass that keeps the docs true to the code, run before each release, after a large change, or when asked. The procedure is the [doc-gardening skill](../.claude/skills/doc-gardening/SKILL.md): give it to any agent as its task.
