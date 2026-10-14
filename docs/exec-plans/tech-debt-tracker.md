---
status: draft
last-verified: 2026-10-14
---

# Tech-debt tracker

Known shortcuts and gaps, written down when they are taken so they get paid off on purpose. Delete a row in the change that pays it off.

| Added | Area | Debt | Why it was taken | Way out |
| :-- | :-- | :-- | :-- | :-- |
| 2026-10-14 | Tests | "Never weaken, skip or delete a failing test" has only review behind it | The template has no test runner yet | When the stack is set up, turn on the linter's rules against skipped and focused tests (`no-disabled-tests` and `no-focused-tests` in the Jest and Vitest lint plugins, and in oxlint) |
| 2026-10-14 | Dependencies | "Ask before adding a dependency" and "never downgrade one to make a build pass" are only partly enforced: Claude Code asks before `npm install` and `npm i` only | Needs the stack's package manager | A CI check that compares the package manifest with the base branch and fails on an added or lowered dependency unless the pull request says who approved it |
| 2026-10-14 | Agents | A local agent can read an unlabelled issue and its comments, and can run `gh` commands that send data out (`gh issue comment`, `gh gist`, `gh api`) without asking | Chosen on 2026-10-14: no prompts before `gh` commands. A fine-grained token limited to this repository ([SECURITY.md](../SECURITY.md#tickets-and-untrusted-text)) bounds what they can reach | Ask rules for those `gh` commands in `.claude/settings.json` |
| 2026-10-14 | Git | A bare `git push` from `main`, and tools other than Claude Code, can push straight to `main` unless branch protection stops them, and GitHub Free offers it only for public repositories | The ask rules match only pushes that name `main`; branch protection depends on the plan and visibility | Branch protection on `main` with bypassing turned off |
| 2026-10-14 | CI | The rule that untrusted text is never interpolated into a workflow ([SECURITY.md](../SECURITY.md)) has only review behind it | A scanner is a new dependency and a CI change | Run a GitHub Actions scanner such as zizmor in CI, or a Semgrep or Opengrep rule over `.github/workflows/` |
