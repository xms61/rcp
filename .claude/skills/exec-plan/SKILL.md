---
name: exec-plan
description: Start, resume or finish an exec plan for work that spans sessions or areas, and split its milestones into GitHub issue tickets. Use when starting multi-session work, picking up planned work or a ticket, splitting work for parallel agents, or closing it out.
---

# Exec plan

The rules and the templates are in [docs/PLANS.md](../../../docs/PLANS.md); this is the procedure.

## Start
1. List `docs/exec-plans/active/`. If a plan already covers the work, resume it instead.
2. Copy the template from docs/PLANS.md to `docs/exec-plans/active/YYYY-MM-DD-<short-name>.md`, dated with today's UTC date.
3. Fill in Purpose, Context and Plan. Split the plan into milestones that can each be verified on their own, and write the Validation commands.
4. If the request leaves design choices open, interview the user before writing code. Ask in rounds: a round holds every open question that doesn't wait on another question's answer, numbered, each with your recommended answer and worded so that "yes" accepts it. Look facts up in the code and docs yourself; only decisions go to the user. Stop when no question is left and the user agrees you understand each other. Log each answer in the Decision log, and write a design doc for a decision that clears [the bar](../../../docs/design-docs/index.md). Add a term the interview settled to `docs/GLOSSARY.md` if it exists, or create it when the user and the code used different words for one thing ([KNOWLEDGE_BASE.md](../../../docs/KNOWLEDGE_BASE.md#growing-the-docs)).
5. If milestones can run in parallel, or another person or a cloud agent will pick them up, split them into tickets.

## Split into tickets
1. Draft the tickets by the rules in [PLANS.md](../../../docs/PLANS.md#tickets): for each, a title naming the behavior it delivers, how to demonstrate it, and the tickets that block it.
2. Show the user the numbered list and ask whether the size is right, whether each blocking edge is real, and whether any ticket should merge or split. Publish nothing until they approve.
3. Create the parent issue for the plan, then the tickets, blockers first, as PLANS.md shows.
4. Link each ticket from the plan's Plan and Progress sections, and commit the plan.
5. Once the plan is on `main`, add the `ready-for-agent` label to the tickets.

## Resume
1. Read the plan: Progress, Decision log and Surprises first.
2. Check that the code matches the ticked milestones. Record any drift under Surprises.
3. Continue from the first unticked milestone. If the milestones are tickets, read their state on GitHub instead and take one you are allowed to take ([PLANS.md](../../../docs/PLANS.md#tickets)).

## While working
- Tick milestones and log decisions in the same commits as the code, not at the end.
- On a ticket, leave the plan's Progress lines alone: the ticket is done when the pull request that says `Closes #<n>` merges, and Finish ticks the lines. Decisions still go in the Decision log; if another ticket's pull request conflicts there, keep both lines.
- Shortcuts go in the [tech-debt tracker](../../../docs/exec-plans/tech-debt-tracker.md) when you take them.

## Finish
1. If the plan has tickets, check that every one is closed, tick their Progress lines, and close the parent issue.
2. Run the Validation commands and record the result.
3. Fill in Outcome, move the file to `docs/exec-plans/completed/`, and update links to it.
4. Run `pnpm verify`.

The interview in Start step 4 is adapted from [Matt Pocock's grilling skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) (MIT License, Copyright (c) 2026 Matt Pocock); the ticket rules follow his to-tickets skill.
