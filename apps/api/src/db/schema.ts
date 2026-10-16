import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// The database tables (recipes v1 plan). The shape the app sees is @rcp/domain's Recipe; src/db/recipes.ts maps
// between the two. A change here needs a migration: `pnpm --filter @rcp/api db:generate`, then commit drizzle/.

export const recipes = sqliteTable(
  'recipes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    servings: integer('servings').notNull(),
    timeMinutes: integer('time_minutes'),
    // One serving: a share of the recipe, a weight of the finished dish, or pieces (servingSchema).
    servingKind: text('serving_kind', { enum: ['share', 'weight', 'pieces'] })
      .notNull()
      .default('share'),
    servingGrams: real('serving_grams'),
    servingPieces: integer('serving_pieces'),
    finishedWeightGrams: real('finished_weight_grams'),
    taste: integer('taste'),
    difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }),
    price: integer('price'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    check('serving_kind_valid', sql`${table.servingKind} in ('share', 'weight', 'pieces')`),
    index('recipes_updated_at').on(table.updatedAt),
  ],
);

export const ingredientGroups = sqliteTable(
  'ingredient_groups',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull().default(''),
  },
  (table) => [index('ingredient_groups_recipe').on(table.recipeId, table.position)],
);

export const ingredientLines = sqliteTable(
  'ingredient_lines',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: integer('group_id')
      .notNull()
      .references(() => ingredientGroups.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    amount: real('amount'),
    unit: text('unit'),
    // The food as written. A link to a food table row comes with the food tables plan.
    food: text('food').notNull(),
    note: text('note').notNull().default(''),
    original: text('original').notNull().default(''),
    // A JSON array of flavor names, such as ["salty"].
    flavors: text('flavors').notNull().default('[]'),
  },
  (table) => [index('ingredient_lines_group').on(table.groupId, table.position)],
);

export const steps = sqliteTable(
  'steps',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    text: text('text').notNull(),
    timerSeconds: integer('timer_seconds'),
  },
  (table) => [index('steps_recipe').on(table.recipeId, table.position)],
);
