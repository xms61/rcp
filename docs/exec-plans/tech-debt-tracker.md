---
status: draft
last-verified: 2026-10-16
---

# Tech-debt tracker

Known shortcuts and gaps, written down when they are taken so they get paid off on purpose. Delete a row in the change that pays it off.

| Added | Area | Debt | Why it was taken | Way out |
| :-- | :-- | :-- | :-- | :-- |
| 2026-10-15 | Data | No nightly backup of the VPS database yet, though the [design doc](../design-docs/mobile-app-and-api.md) commits to one | The database exists since 2026-10-16 ([recipes v1](active/2026-10-16-recipes-v1.md)), but nothing is deployed yet | Add the systemd backup timer and a restore drill, as BeanQuery's `docs/DEPLOY.md` has, before the first deploy with recipe data, in the migration plan's milestone 4 |
| 2026-10-14 | Tests | No verification skill (`.claude/skills/verify-rcp/`) drives the running app yet ([TESTING.md](../TESTING.md#verification-skill)) | The app has no user-facing feature to prove it on | Write it and prove it with the first feature that stores recipes, driving the Android app and the API |
| 2026-10-14 | Dependencies | "Ask before adding a dependency" and "never downgrade one to make a build pass" are only partly enforced: Claude Code asks before `pnpm add`, `pnpm install` and `pnpm i` (and npm's install commands) only | Nothing compares the manifest across a pull request yet | A CI check that compares the package manifest with the base branch and fails on an added or lowered dependency unless the pull request says who approved it |
| 2026-10-14 | Agents | A local agent can read an unlabelled issue and its comments, and can run `gh` commands that send data out (`gh issue comment`, `gh gist`, `gh api`) without asking | Chosen on 2026-10-14: no prompts before `gh` commands. A fine-grained token limited to this repository ([SECURITY.md](../SECURITY.md#tickets-and-untrusted-text)) bounds what they can reach | Ask rules for those `gh` commands in `.claude/settings.json` |
| 2026-10-14 | Git | A bare `git push` from `main`, and tools other than Claude Code, can push straight to `main` unless branch protection stops them, and GitHub Free offers it only for public repositories | The ask rules match only pushes that name `main`; branch protection depends on the plan and visibility | Branch protection on `main` with bypassing turned off |
| 2026-10-14 | CI | The rule that untrusted text is never interpolated into a workflow ([SECURITY.md](../SECURITY.md)) has only review behind it | A scanner is a new dependency and a CI change | Run a GitHub Actions scanner such as zizmor in CI, or a Semgrep or Opengrep rule over `.github/workflows/` |
