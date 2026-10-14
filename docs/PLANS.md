---
status: draft
last-verified: 2026-10-14
---

# Plans

## Which kind of plan
- **Small change** (one session, one area, describable in one sentence): no plan file. Notes go in `docs/scratch/` if they help; the PR description records the outcome.
- **Exec plan**: work that spans sessions or areas, a migration, or anything someone else may have to resume. It is committed with the code and updated in the same commits.
- **Exec plan with tickets**: an exec plan whose milestones can run in parallel, or will be picked up by another person or a cloud agent. Those milestones become [tickets](#tickets) on GitHub Issues.

## Exec plans
- Create `docs/exec-plans/active/YYYY-MM-DD-<short-name>.md` from the template below before the first code change. Check the [active plans](exec-plans/active/) first: the work may already be planned. The [exec-plan skill](../.claude/skills/exec-plan/SKILL.md) walks an agent through starting, resuming and finishing one.
- Write it for a reader who has only the repo and the plan: link the files and docs it depends on instead of assuming them.
- Make every milestone small enough to verify on its own, and say how.
- Tick progress items and log decisions as they happen, not at the end. Milestones that are tickets are the exception: GitHub tracks them ([Tickets](#tickets)).
- In the change that finishes the work, fill in Outcome and move the file to the [completed plans](exec-plans/completed/). Follow-ups that won't be done now go in the [tech-debt tracker](exec-plans/tech-debt-tracker.md).

The doc checks require Purpose, Progress and Decision log in active plans, and Outcome as well in completed ones.

## Tickets
The exec plan stays the map: purpose, context, decision log, surprises and validation. Its tickets hold the work, one GitHub issue per milestone, so agents can claim milestones separately and GitHub shows which are blocked. Decisions go in the plan's decision log or a design doc, never only in a ticket or its comments.
- **Slice vertically.** Each ticket delivers one behavior through every layer it needs, can be demonstrated on its own, and fits in one fresh agent session. A ticket that ships one layer, such as all the schema before any of the API, can't be verified until the others land.
- **Prefactor first.** A change that makes the work easier comes before it, as its own ticket.
- **Wide mechanical changes go expand, migrate, contract.** Renaming something used everywhere can't land as one green slice: add the new form beside the old, move the callers over in batches of one ticket each, then delete the old form in a ticket blocked by every batch.
- **Every acceptance criterion fails at the commit where the work starts.** A criterion that is already true, or that only another ticket can satisfy, grades nothing.
- **Don't split what fits in one session.** A change one agent can finish in one session needs no tickets.

Publishing, blockers first so that each ticket can name its blockers: create a parent issue for the plan that links the plan file, then each ticket as its sub-issue with native blocked-by links.

```bash
gh issue create --parent <plan-issue> --blocked-by <n>,<n> --title "<behavior it delivers>" --body-file <file>
```

In the plan, the Plan section links each ticket instead of copying it, and each ticket's Progress line is the link. Once the plan is on `main`, where whoever picks up a ticket can read it, label the tickets: `gh issue edit <n> --add-label ready-for-agent`.

GitHub holds whether a ticket is done. A ticket's pull request leaves the plan's Progress lines alone, so parallel pull requests don't edit the same lines; they are ticked when the plan finishes. Decisions still go in the Decision log in the same pull request; when two pull requests conflict there, keep both lines.

Working a ticket: take an open, unassigned ticket labelled `ready-for-agent` whose blockers are all closed. Assign yourself before starting (`gh issue edit <n> --add-assignee @me`), then read the assignees again and leave the ticket if someone else took it too. Work on your own branch, and put `Closes #<n>` in the pull request description so the merge closes the ticket. How agents treat issue and comment text is in [SECURITY.md](SECURITY.md#tickets-and-untrusted-text).

Ticket body:

```md
## What it delivers
The behavior a user or developer gets, and how to demonstrate it.

## Acceptance criteria
- [ ] <an observable result that is false at the starting commit>

## Context
Links to the exec plan and the docs this depends on. Name modules and behavior rather than file paths and line numbers, which go stale before the ticket is picked up.
```

## Template
```md
# <Goal in a few words>

## Purpose
What a user or developer gets when this is done, and how to see it working.

## Context
The files, docs and constraints this work depends on, as links.

## Plan
Milestones in order, each small enough to verify on its own.

## Progress
- [ ] <milestone> (when done: `- [x] YYYY-MM-DD <milestone>`)

## Decision log
- YYYY-MM-DD: <decision>, because <reason>. Rejected: <alternatives>.

## Surprises
What turned out different from the plan, with the evidence.

## Validation
The commands to run and the result that shows the work is done.

## Outcome
Filled in when the plan moves to completed/: what shipped, what did not, and the follow-ups.
```
