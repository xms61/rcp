import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts, so unit tests run without the TanStack Start plugin and its dev server.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
