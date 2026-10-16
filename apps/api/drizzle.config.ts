import { defineConfig } from 'drizzle-kit';

// drizzle-kit writes a SQL migration to drizzle/ from the difference between src/db/schema.ts and the last one.
// The API applies them at start (src/db/database.ts).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
