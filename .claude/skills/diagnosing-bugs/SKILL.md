---
name: diagnosing-bugs
description: Find a bug's cause from a failing reproduction before changing code, then fix it and keep a regression test. Use when something is broken, throws, fails or got slow, when a check fails for no clear reason, or when a ticket reports a defect.
---

# Diagnosing bugs

The testing rules are in [docs/TESTING.md](../../../docs/TESTING.md); this is the procedure. Change no product code until step 1 is done.

## 1. Build a check that goes red on this bug
Everything else depends on it. Try, roughly in this order: a failing test at the layer that reaches the bug; a command or HTTP request against the running app, or a run of the project's verification skill; a replay of a captured input; a script for `git bisect run` when the bug appeared between two known commits.
- It reproduces the symptom that was reported, not a failure nearby, and gives the same verdict every run. For a flaky bug, raise the failure rate (loop it, add load) until it fails often enough to work with.
- It runs in seconds, without a person.
- Step 1 is done when you can name one command that you have run and seen fail with that symptom.

If you can't build one, stop: say what you tried, and ask for access to where it reproduces or for a captured log or input. Without a red check, a cause is a guess. Show commands and output with secrets replaced by `<REDACTED>`.

## 2. Make it small
Cut inputs, steps, config and callers one at a time, running the check after each cut, until removing anything more makes it pass.

## 3. List the candidate causes
Write three to five, most likely first, each with the observation that would rule it out: "if X is the cause, changing Y makes the bug go away". Show the list to the user if they are around; otherwise carry on with your ranking.

## 4. Test one cause at a time
Use a debugger, or a few logs at the boundary in question, each tagged with one unique prefix such as `[debug-4f2a]`. For something slow, measure a baseline and compare instead of reading logs. If two fixes have failed, the causes you listed share a wrong assumption: go back to step 3 and question it.

## 5. Fix it and keep the test
1. Turn the small check into a regression test at a layer where it exercises the real bug. If no unit test can reach it, use an end-to-end check ([TESTING.md](../../../docs/TESTING.md)); if nothing can, say so in the pull request and add a row to the [tech-debt tracker](../../../docs/exec-plans/tech-debt-tracker.md).
2. Watch the test fail, fix the root cause, and watch it pass. Run the check from step 1 again.
3. Remove every tagged log (search for the prefix) and any throwaway script, then run `pnpm verify`.
4. In the commit or pull request, state the cause you confirmed and the evidence for it.

Adapted from [Matt Pocock's diagnosing-bugs skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md) (MIT License, Copyright (c) 2026 Matt Pocock).
