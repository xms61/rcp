import { openDatabase } from './db/database';

/** A fresh in-memory database with the real migrations, for tests. */
export function openTestDatabase() {
  return openDatabase(':memory:', new URL('../drizzle/', import.meta.url));
}
