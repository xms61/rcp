---
name: retro
description: Turn mistakes agents keep making in this repo into checks, pointers and review rules, so the next session can't repeat them. Use when asked for a retro, after a session that went worse than it should have, or when an agent is corrected for a mistake it made before.
disable-model-invocation: true
---

# Retro

Changes the agents' environment, not the product code: a check, a pointer or a review rule that stops a mistake from happening again. How to write a check is in [docs/CODE_STYLE.md](../../../docs/CODE_STYLE.md#custom-checks); this is the procedure. It proposes; the user picks what to apply.

Write each fix for an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that passes `pnpm verify`.

## 1. Collect the evidence
1. Read the session the user names, or this one. For a wider pass, also read recent commits, reverts, review comments, closed tickets, and code comments that explain a workaround.
2. List each moment an agent went wrong, was corrected, or took long to find something: what happened, where, and what it cost.
3. Group the moments into classes. A class counts once it has happened twice; a one-off is an anecdote, not a rule.

## 2. Pick the level for each class
Use the highest level that works. Nothing fails when an agent skips a doc, so docs come last.
1. **Structure:** one owner per piece of state, one supported way per task, internals the wrong import can't reach, one source of truth instead of lists kept in sync by hand. Delete the old way an agent would copy.
2. **Types**, so the bad state can't be written.
3. **A check whose error names the fix:** a lint rule, a structural test, a script in `scripts/`, a hook. If a check that would have caught it exists but doesn't run in `pnpm verify`, wire it in instead of writing a new one.
4. **A test** of the behavior.
5. **A review rule**, for judgment calls only, in [REVIEW.md](../../../REVIEW.md) or [CODE_STYLE.md](../../../docs/CODE_STYLE.md). The reviewer gets a diff and has room to apply them; the implementing agent has neither.
6. **A pointer**, when the agent took long to find a file or fact: a row in the AGENTS.md map, a link from the doc it already read, or a nested AGENTS.md.

A mechanical mistake gets a check, not a line in AGENTS.md: that line loads into every session, and nothing enforces it. While reading, also note instructions that change nothing an agent would do anyway, tool calls that cost a lot for what they returned, and information the agent needed but couldn't reach.

## 3. Propose
List the candidates, most severe first. For each: the class, the moments that show it, the level, why a higher level doesn't work, and the change. Drop any candidate you can't trace to a moment. Wait for the user to pick.

## 4. Apply what the user picked
1. One commit per class.
2. Prove each new check fails on the real past mistake: run it on a fixture or commit that reproduces the mistake, keep that case in the check's tests, and show the check passes on the fixed code.
3. If the pattern is already common, fail only when a change adds more, and put the rest in the [tech-debt tracker](../../../docs/exec-plans/tech-debt-tracker.md).
4. When a rule gains or loses an enforcer, update its row: AGENTS.md boundaries in [SECURITY.md](../../../docs/SECURITY.md#boundaries-and-what-enforces-them), code rules under Invariants in [ARCHITECTURE.md](../../../ARCHITECTURE.md#invariants). A rule that had a row with nothing behind it and was broken again is a repeat: fix it at a higher level in the same change.
5. Run `pnpm verify`.
