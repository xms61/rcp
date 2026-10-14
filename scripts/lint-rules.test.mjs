// Tests for the rules eslint.config.js adds on top of the shared configs: the domain layer boundary and the ban on
// skipped and focused tests. Type-aware rules are switched off here; they need files that exist in the TS project.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const eslint = new ESLint({ overrideConfig: [{ files: ['**/*.ts'], ...tseslint.configs.disableTypeChecked }] });

async function ruleIds(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? message.message);
}

async function isBlockedInDomain(specifier, filePath = 'src/domain/units.ts') {
  const ids = await ruleIds(`import x from '${specifier}';\nexport const y = x;\n`, filePath);
  return ids.includes('no-restricted-imports');
}

test('src/domain/ may not import React, TanStack, Node built-ins or another src/ layer', async () => {
  const specifiers = [
    'react',
    'react-dom/client',
    '@tanstack/react-router',
    'node:fs',
    'fs',
    'path',
    '../routes/index',
    '../router',
    '../routeTree.gen',
    '../server/recipes',
    '../db',
  ];
  const blocked = {};
  for (const specifier of specifiers) blocked[specifier] = await isBlockedInDomain(specifier);
  assert.deepEqual(blocked, Object.fromEntries(specifiers.map((specifier) => [specifier, true])));
  assert.equal(await isBlockedInDomain('../../routes/index', 'src/domain/nutrition/sum.ts'), true);
});

test('src/domain/ may import other domain files', async () => {
  assert.equal(await isBlockedInDomain('./units'), false);
  assert.equal(await isBlockedInDomain('../units', 'src/domain/nutrition/sum.ts'), false);
});

test('a skipped or focused test fails lint', async () => {
  const skipped = "import { expect, test } from 'vitest';\ntest.skip('a', () => { expect(1).toBe(1); });\n";
  const focused =
    "import { describe, expect, test } from 'vitest';\ndescribe.only('a', () => { test('b', () => { expect(1).toBe(1); }); });\n";
  assert.deepEqual(await ruleIds(skipped, 'src/domain/units.test.ts'), ['vitest/no-disabled-tests']);
  assert.deepEqual(await ruleIds(focused, 'src/domain/units.test.ts'), ['vitest/no-focused-tests']);
});
