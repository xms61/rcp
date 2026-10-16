// Tests for the rules eslint.config.js adds on top of the shared configs: the domain package's import boundary and the
// ban on skipped and focused tests. Type-aware rules are switched off here; they need files that exist in the TS project.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const eslint = new ESLint({ overrideConfig: [{ files: ['**/*.ts'], ...tseslint.configs.disableTypeChecked }] });

async function ruleIds(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? message.message);
}

async function isBlockedInDomain(specifier, filePath = 'packages/domain/src/units.ts') {
  const ids = await ruleIds(`import x from '${specifier}';\nexport const y = x;\n`, filePath);
  return ids.includes('no-restricted-imports');
}

test('packages/domain may not import any package, Node built-in or app', async () => {
  const specifiers = [
    'react',
    'react-native',
    'expo-router',
    'hono',
    'drizzle-orm',
    '@rcp/api',
    'node:fs',
    'fs',
    'path',
    'vitest',
    'zod-to-json-schema',
    '@hono/zod-validator',
  ];
  const blocked = {};
  for (const specifier of specifiers) blocked[specifier] = await isBlockedInDomain(specifier);
  assert.deepEqual(blocked, Object.fromEntries(specifiers.map((specifier) => [specifier, true])));
});

test('packages/domain may import its own files and zod, and its tests may import vitest', async () => {
  assert.equal(await isBlockedInDomain('./units'), false);
  assert.equal(await isBlockedInDomain('zod'), false);
  assert.equal(await isBlockedInDomain('../units', 'packages/domain/src/nutrition/sum.ts'), false);
  assert.equal(await isBlockedInDomain('vitest', 'packages/domain/src/units.test.ts'), false);
});

test('a skipped or focused test fails lint', async () => {
  const skipped = "import { expect, test } from 'vitest';\ntest.skip('a', () => { expect(1).toBe(1); });\n";
  const focused =
    "import { describe, expect, test } from 'vitest';\ndescribe.only('a', () => { test('b', () => { expect(1).toBe(1); }); });\n";
  assert.deepEqual(await ruleIds(skipped, 'packages/domain/src/units.test.ts'), ['vitest/no-disabled-tests']);
  assert.deepEqual(await ruleIds(focused, 'packages/domain/src/units.test.ts'), ['vitest/no-focused-tests']);
});

test('apps/mobile may not import the API, but may use the domain package and its own files', async () => {
  const file = 'apps/mobile/src/connection/check.ts';
  const blocked = async (specifier) =>
    (await ruleIds(`import x from '${specifier}';\nexport const y = x;\n`, file)).includes('no-restricted-imports');
  const specifiers = ['@rcp/api', '@rcp/api/src/app', '../../../api/src/app', '@rcp/domain', './url'];
  const result = {};
  for (const specifier of specifiers) result[specifier] = await blocked(specifier);
  assert.deepEqual(result, {
    '@rcp/api': true,
    '@rcp/api/src/app': true,
    '../../../api/src/app': true,
    '@rcp/domain': false,
    './url': false,
  });
});
