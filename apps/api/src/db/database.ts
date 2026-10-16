import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

/**
 * Opens the SQLite file at `path` (`:memory:` for tests) and applies any migration in `migrationsFolder` that it
 * hasn't had yet, so a new release brings its own schema changes.
 */
export function openDatabase(path: string, migrationsFolder: URL) {
  const sqlite = new Database(path);
  // WAL lets the nightly backup read while the API writes; foreign keys make deletes cascade (schema.ts).
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  // SQLite's lower() and LIKE fold ASCII letters only, so search compares fold(column) instead: JavaScript's
  // Unicode-aware lower case, so "Äpfel" matches "äpfel" (src/db/recipes.ts).
  sqlite.function('fold', { deterministic: true }, (value: unknown) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  );
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: fileURLToPath(migrationsFolder) });
  return { db, sqlite, close: () => sqlite.close() };
}

export type Db = ReturnType<typeof openDatabase>['db'];
