import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // scripts/ is plain Node tooling with its own tests.
  globalIgnores(['**/dist/', 'scripts/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  // JavaScript config files sit outside the TypeScript projects, so the type-aware rules skip them.
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.test.{ts,tsx}'],
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      // A skipped or focused test turns a failing check green without fixing anything.
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
    },
  },
  {
    // ARCHITECTURE.md: packages/domain is plain TypeScript with no dependencies, so the app and the API can both use
    // it. Its own tsconfig's rootDir stops relative imports that leave src/. Tested in scripts/lint-rules.test.mjs.
    files: ['packages/domain/src/**'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.\\.?/)',
              message:
                'packages/domain imports nothing but its own files: no packages, Node APIs or apps. Do the I/O in apps/api or apps/mobile and pass plain values into the domain function.',
            },
          ],
        },
      ],
    },
  },
);
