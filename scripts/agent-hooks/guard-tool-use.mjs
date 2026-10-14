#!/usr/bin/env node
// PreToolUse hook shared by Claude Code (.claude/settings.json) and Codex (.codex/hooks.json). It blocks edits
// to files an agent must not change and shell commands that bypass the repo's guardrails. Instructions in
// AGENTS.md are requests; this is the enforcement. Exit code 2 blocks the call and sends stderr back to the
// agent, so each message says what to do instead.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOCKED = 2;
const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);
const FILE_RULES = [
  {
    test: (path) => /(^|\/)\.env(\.[^/]+)?$/.test(path) && !/(^|\/)\.env\.example$/.test(path),
    reason: 'holds local secrets. Add the variable name to .env.example and ask the user to set the value.',
  },
  {
    test: (path) => /(^|\/)\.git\//.test(path),
    reason: "is git's internal state. Use git commands instead.",
  },
  {
    test: (path) => /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(path),
    reason: 'is written by the package manager. Change package.json and run the install command instead.',
  },
  {
    test: (path) => /\.(pem|key|p12|pfx)$/i.test(path) || /(^|\/)id_(rsa|dsa|ecdsa|ed25519)/.test(path),
    reason: 'looks like a private key. Keys never go in the repo; ask the user.',
  },
];
// Setting core.hooksPath to anything but the repo's own .githooks, unsetting it (--unset, or `git config unset`
// since git 2.46) or removing the core section turns the hooks off.
const HOOKS_PATH_CHANGE =
  /\bcore\.hooksPath\s*=|\bgit\b[^;&|\n]*\bconfig\b[^;&|\n]*(\bunset\b[^;&|\n]*\bcore\.hooksPath\b|\bremove-section\s+core\b|\bcore\.hooksPath\s+(?!["']?(\.\/)?\.githooks\/?["']?(\s|$|[;&|]))[^\s;&|-])/i;
const SHELL_KEYWORDS = new Set(['then', 'do', 'else', '!', 'time']);
// Short options of git commit that take a value: in a group such as -am, everything after one is the value.
const COMMIT_VALUE_OPTIONS = new Set(['m', 'c', 'C', 'F', 't', 'S', 'u']);

function groupHasNoVerify(group) {
  for (const option of group) {
    if (option === 'n') return true;
    if (COMMIT_VALUE_OPTIONS.has(option)) return false;
  }
  return false;
}

// The index of the git subcommand: the first word after git that isn't an option, skipping the values of -C and
// -c, after any VAR=value assignments and shell keywords in front of git. -1 when the words don't run git.
function gitSubcommandIndex(words) {
  let index = 0;
  while (index < words.length && (SHELL_KEYWORDS.has(words[index]) || /^[A-Za-z_]\w*=/.test(words[index]))) index++;
  if (!/^git(\.exe)?$/i.test(words[index] ?? '')) return -1;
  for (index += 1; index < words.length; index++) {
    if (words[index] === '-C' || words[index] === '-c') index++;
    else if (!words[index].startsWith('-')) return index;
  }
  return -1;
}

// git commit -n is --no-verify, alone or grouped (-an). Quoted text is a message, not options.
function skipsCommitHooks(command) {
  const unquoted = command.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');
  return unquoted.split(/[;&|\n(){}]/).some((part) => {
    const words = part.trim().split(/\s+/);
    const subcommand = gitSubcommandIndex(words);
    if (subcommand < 0 || words[subcommand] !== 'commit') return false;
    return words.slice(subcommand + 1).some((word) => /^-[^-]/.test(word) && groupHasNoVerify(word.slice(1)));
  });
}

const COMMAND_RULES = [
  {
    test: (command) => /(^|\s)--no-verify(?=\s|$)/i.test(command) || HOOKS_PATH_CHANGE.test(command) || skipsCommitHooks(command),
    reason: 'skips the git hooks that check secrets and docs. Fix what the hook reports instead.',
  },
  {
    test: (command) =>
      /\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*\s(-f|--force|--force-with-lease)(=\S*)?(?=\s|$)|\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*\s\+\S/.test(command),
    reason: 'rewrites shared history. Ask the user to run it.',
  },
  {
    test: (command) => /(^|[\s'"=/<>])\.env(?!\.example)(\.[\w.-]+)?(?=$|[\s'";|&)<>])/.test(command),
    reason: 'touches .env, which holds local secrets. Read .env.example for the variable names, and ask the user for values.',
  },
];
// Codex sends file edits as one apply_patch call whose patch names each file it adds, updates, deletes or moves to.
const PATCH_PATH = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;

function editedPaths(event) {
  const input = event.tool_input ?? {};
  if (event.tool_name === 'apply_patch') return [...String(input.command ?? '').matchAll(PATCH_PATH)].map((m) => m[1].trim());
  return [input.file_path, input.notebook_path].filter((path) => typeof path === 'string');
}

function shellCommand(event) {
  return SHELL_TOOLS.has(event.tool_name) ? String(event.tool_input?.command ?? '') : '';
}

export function violations(event) {
  const found = [];
  for (const path of editedPaths(event).map((p) => p.replace(/\\/g, '/'))) {
    const rule = FILE_RULES.find(({ test }) => test(path));
    if (rule) found.push(`Blocked edit of ${path}: it ${rule.reason}`);
  }
  const command = shellCommand(event);
  for (const { test, reason } of COMMAND_RULES) {
    if (test(command)) found.push(`Blocked command: it ${reason}`);
  }
  return found;
}

function main() {
  let event;
  try {
    event = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    console.error('guard-tool-use: could not parse the hook input; allowing the call.');
    process.exit(1);
  }
  const found = violations(event);
  if (found.length) {
    console.error(found.join('\n'));
    process.exit(BLOCKED);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
