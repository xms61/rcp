---
status: draft
last-verified: 2026-10-14
---

# Code style

How code in this repo is written. A rule a tool can check belongs in the linter or formatter config, not here; this doc keeps the judgment calls and their reasons.

## Principles
- Small functions with one job, and clear names instead of comments that say what the code does. Comments explain why.
- No speculative abstractions: build for the cases that exist. Three similar lines beat a premature helper.
- Delete dead code instead of keeping it "for later"; git remembers it.
- Prefer boring, well-known libraries and the platform's built-ins. Agents and new people already know them, and their APIs are stable.
- Validate input where it enters the system, and make error messages say what went wrong and how to fix it. The reader is often an agent that will act on the message.
- Structured logs with stable field names. Never log secrets or personal data.
- No emoji or marketing words in code, logs, commits or docs. A coding agent's own attribution line is the exception ([below](#commits-and-pull-requests)).

## Custom checks
When a rule can be checked, write the check instead of the sentence. The [retro skill](../.claude/skills/retro/SKILL.md) decides which level a rule gets; this is how to write the check.
- Configure an existing rule before writing a new one. Most "use X, not Y" rules are a setting of a rule the linter already has, such as ESLint's `no-restricted-imports` or `no-restricted-syntax`, with a custom message.
- The error names the fix: the file, function or command to use instead, in words an agent can act on.
- Each custom rule has a test with a failing case taken from the real mistake and a passing case for the right form: `invalid` and `valid` cases in the linter's `RuleTester`, or `# ruleid:` and `# ok:` annotations run by `semgrep --test`, plus a `.fixed` file when the rule has an autofix.
- When the pattern is already common, fail only on new occurrences, with ESLint's bulk suppressions or Semgrep's diff-aware scan against a baseline commit, and put the existing ones in the [tech-debt tracker](exec-plans/tech-debt-tracker.md).
- An exception sits on the offending line, names the rule, and says why, who approved it and, if it is temporary, when it expires. Disabling a rule for a whole file or the project needs a person's approval.
- A check that runs while an agent edits, from a hook, reports only findings with a clear fix. A finding without one makes the agent rewrite code just to silence it; leave those to `pnpm verify` and review.
- Which tool: for JavaScript and TypeScript, oxlint with custom rules as JS plugins (ESLint-compatible, but in alpha as of 2026, with no custom type-aware rules and weaker Windows support), or ESLint when a custom rule needs type information. For several languages, or patterns in YAML, Dockerfiles and workflows, Semgrep CE or Opengrep with the rules kept in the repo. For the repo's own structure, a Node script in `scripts/` with tests, like the doc checks. Record the choice under Stack.

## Stack
TODO(template): language version, formatter, linter and their config files, and naming conventions that differ from the ecosystem's defaults. Write here only what the tools can't enforce.

## Commits and pull requests
- Commit subjects follow `type(scope): summary`, with types feat, fix, docs, refactor, test, chore and ci.
- One logical change per PR, small enough to review in one sitting. Agent PRs follow the same rules as human ones; small changes are where agents succeed most often.
- The PR template asks what was verified and how. "Not checked" is a valid answer; a missing answer is not.
- Coding agents record their part themselves: Claude Code adds a `Co-Authored-By` trailer to its commits and an attribution line to the end of its pull request descriptions. Keep what the tool adds, as it adds it, and don't write a second credit by hand.

## Releases
- Pull requests leave the version and CHANGELOG.md alone, so parallel ones don't conflict on the same lines. Both change once, at release.
- Before a release, run the [doc-gardening pass](../.claude/skills/doc-gardening/SKILL.md).
- Bump the version by [Semantic Versioning](https://semver.org/spec/v2.0.0.html) wherever the stack keeps it (`package.json` to start): patch for fixes, minor for new capability, major for breaking changes.
- Write the CHANGELOG.md entry from the pull requests merged since the last release, under Added, Changed, Fixed and Removed ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)). Keep about the latest five releases there, and move older ones to the top of [the archive](CHANGELOG-archive.md).
