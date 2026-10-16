import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { openDatabase } from './database';

const migrationsFolder = new URL('../../drizzle/', import.meta.url);
const opened: { close: () => void }[] = [];
const dirs: string[] = [];

function open(path = ':memory:') {
  const database = openDatabase(path, migrationsFolder);
  opened.push(database);
  return database;
}

afterEach(() => {
  for (const database of opened.splice(0)) database.close();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('openDatabase', () => {
  test('creates the tables on a new database', () => {
    const { sqlite } = open();
    const tables = sqlite
      .prepare(
        "select name from sqlite_master where type = 'table' and name not like '\\_\\_%' escape '\\' and name != 'sqlite_sequence' order by name",
      )
      .all();
    expect(tables).toEqual([
      { name: 'ingredient_groups' },
      { name: 'ingredient_lines' },
      { name: 'recipes' },
      { name: 'steps' },
    ]);
  });

  test('turns foreign keys on, so deleting a recipe deletes its groups, lines and steps', () => {
    const { sqlite } = open();
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
    const now = new Date().toISOString();
    const recipe = sqlite
      .prepare('insert into recipes (title, servings, created_at, updated_at) values (?, ?, ?, ?)')
      .run('Pasta e ceci', 4, now, now);
    const group = sqlite
      .prepare('insert into ingredient_groups (recipe_id, position) values (?, 0)')
      .run(recipe.lastInsertRowid);
    sqlite
      .prepare("insert into ingredient_lines (group_id, position, food) values (?, 0, 'olive oil')")
      .run(group.lastInsertRowid);
    sqlite
      .prepare("insert into steps (recipe_id, position, text) values (?, 0, 'Warm the oil.')")
      .run(recipe.lastInsertRowid);

    sqlite.prepare('delete from recipes where id = ?').run(recipe.lastInsertRowid);

    for (const table of ['ingredient_groups', 'ingredient_lines', 'steps']) {
      expect(sqlite.prepare(`select count(*) as n from ${table}`).get()).toEqual({ n: 0 });
    }
  });

  test('rejects a serving kind the app does not know', () => {
    const { sqlite } = open();
    const insert = () =>
      sqlite
        .prepare(
          "insert into recipes (title, servings, serving_kind, created_at, updated_at) values ('x', 1, 'bowls', '', '')",
        )
        .run();
    expect(insert).toThrow(/CHECK constraint failed/);
  });

  test('keeps the data when the database is opened again, and applies each migration once', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rcp-db-'));
    dirs.push(dir);
    const path = join(dir, 'rcp.db');
    const first = open(path);
    first.sqlite
      .prepare("insert into recipes (title, servings, created_at, updated_at) values ('Soup', 2, '', '')")
      .run();
    first.close();
    opened.splice(opened.indexOf(first), 1);

    const second = open(path);
    expect(second.sqlite.prepare('select title from recipes').all()).toEqual([{ title: 'Soup' }]);
  });
});
