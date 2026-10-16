import {
  FLAVORS,
  type Flavor,
  type Recipe,
  type RecipeInput,
  type RecipeQuery,
  type RecipeSummary,
  type Unit,
} from '@rcp/domain';
import { and, asc, desc, eq, inArray, lte, gte, sql, type SQL } from 'drizzle-orm';
import type { Db } from './database';
import { ingredientGroups, ingredientLines, recipes, steps } from './schema';

// Reads and writes recipes. Each write maps the validated input's fields to columns one by one, so a field the
// schema doesn't know can never reach a column.

type RecipeRow = typeof recipes.$inferSelect;

function recipeColumns(input: RecipeInput) {
  return {
    title: input.title,
    description: input.description,
    servings: input.servings,
    timeMinutes: input.timeMinutes,
    servingKind: input.serving.kind,
    servingGrams: input.serving.kind === 'weight' ? input.serving.grams : null,
    servingPieces: input.serving.kind === 'pieces' ? input.serving.count : null,
    finishedWeightGrams: input.finishedWeightGrams,
    taste: input.rating.taste,
    difficulty: input.rating.difficulty,
    price: input.rating.price,
  };
}

function insertParts(tx: Db, recipeId: number, input: RecipeInput) {
  input.groups.forEach((group, groupPosition) => {
    const [row] = tx
      .insert(ingredientGroups)
      .values({ recipeId, position: groupPosition, title: group.title })
      .returning({ id: ingredientGroups.id })
      .all();
    if (!row) throw new Error('The ingredient group was not stored.');
    if (group.lines.length === 0) return;
    tx.insert(ingredientLines)
      .values(
        group.lines.map((line, position) => ({
          groupId: row.id,
          position,
          amount: line.amount,
          unit: line.unit,
          food: line.food,
          note: line.note,
          original: line.original,
          flavors: JSON.stringify(line.flavors),
        })),
      )
      .run();
  });
  if (input.steps.length === 0) return;
  tx.insert(steps)
    .values(
      input.steps.map((step, position) => ({ recipeId, position, text: step.text, timerSeconds: step.timerSeconds })),
    )
    .run();
}

function toRecipe(db: Db, row: RecipeRow): Recipe {
  const groups = db
    .select()
    .from(ingredientGroups)
    .where(eq(ingredientGroups.recipeId, row.id))
    .orderBy(asc(ingredientGroups.position))
    .all();
  const lines = groups.length
    ? db
        .select()
        .from(ingredientLines)
        .where(
          inArray(
            ingredientLines.groupId,
            groups.map((group) => group.id),
          ),
        )
        .orderBy(asc(ingredientLines.position))
        .all()
    : [];
  const stepRows = db.select().from(steps).where(eq(steps.recipeId, row.id)).orderBy(asc(steps.position)).all();
  const serving: Recipe['serving'] =
    row.servingKind === 'weight'
      ? { kind: 'weight', grams: row.servingGrams ?? 0 }
      : row.servingKind === 'pieces'
        ? { kind: 'pieces', count: row.servingPieces ?? 0 }
        : { kind: 'share' };
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    servings: row.servings,
    timeMinutes: row.timeMinutes,
    serving,
    finishedWeightGrams: row.finishedWeightGrams,
    rating: { taste: row.taste, difficulty: row.difficulty, price: row.price },
    groups: groups.map((group) => ({
      title: group.title,
      lines: lines
        .filter((line) => line.groupId === group.id)
        .map((line) => ({
          amount: line.amount,
          unit: line.unit as Unit | null,
          food: line.food,
          note: line.note,
          original: line.original,
          flavors: JSON.parse(line.flavors) as Flavor[],
        })),
    })),
    steps: stepRows.map((step) => ({ text: step.text, timerSeconds: step.timerSeconds })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createRecipe(db: Db, input: RecipeInput, now = new Date()): Recipe {
  const id = db.transaction((tx) => {
    const timestamp = now.toISOString();
    const [row] = tx
      .insert(recipes)
      .values({ ...recipeColumns(input), createdAt: timestamp, updatedAt: timestamp })
      .returning({ id: recipes.id })
      .all();
    if (!row) throw new Error('The recipe was not stored.');
    insertParts(tx as unknown as Db, row.id, input);
    return row.id;
  });
  const recipe = getRecipe(db, id);
  if (!recipe) throw new Error('The stored recipe could not be read back.');
  return recipe;
}

export function getRecipe(db: Db, id: number): Recipe | undefined {
  const row = db.select().from(recipes).where(eq(recipes.id, id)).get();
  return row ? toRecipe(db, row) : undefined;
}

/** Replaces the recipe with `input`, lines and steps included. Undefined when there is no such recipe. */
export function replaceRecipe(db: Db, id: number, input: RecipeInput, now = new Date()): Recipe | undefined {
  const found = db.transaction((tx) => {
    const updated = tx
      .update(recipes)
      .set({ ...recipeColumns(input), updatedAt: now.toISOString() })
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id })
      .all();
    if (updated.length === 0) return false;
    // Deleting the groups deletes their lines too (ON DELETE CASCADE).
    tx.delete(ingredientGroups).where(eq(ingredientGroups.recipeId, id)).run();
    tx.delete(steps).where(eq(steps.recipeId, id)).run();
    insertParts(tx as unknown as Db, id, input);
    return true;
  });
  return found ? getRecipe(db, id) : undefined;
}

export function deleteRecipe(db: Db, id: number): boolean {
  return db.delete(recipes).where(eq(recipes.id, id)).run().changes > 0;
}

/**
 * `value` as a LIKE pattern that matches it anywhere, with %, _ and \ taken literally. It is lower-cased the way
 * fold() lowers the column (src/db/database.ts), so the match ignores case beyond ASCII too.
 */
function contains(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function hasFood(pattern: string) {
  return sql`exists (select 1 from ${ingredientLines} join ${ingredientGroups} on ${ingredientGroups.id} = ${ingredientLines.groupId}
    where ${ingredientGroups.recipeId} = ${recipes.id} and fold(${ingredientLines.food}) like ${pattern} escape '\\')`;
}

const LIST_LIMIT = 500;

export function listRecipes(db: Db, query: RecipeQuery): RecipeSummary[] {
  const conditions: SQL[] = [];
  if (query.q) {
    const pattern = contains(query.q);
    conditions.push(sql`(fold(${recipes.title}) like ${pattern} escape '\\' or ${hasFood(pattern)})`);
  }
  for (const food of query.with) conditions.push(hasFood(contains(food)));
  for (const food of query.without) conditions.push(sql`not ${hasFood(contains(food))}`);
  if (query.tasteMin !== undefined) conditions.push(gte(recipes.taste, query.tasteMin));
  if (query.difficulty.length) conditions.push(inArray(recipes.difficulty, query.difficulty));
  if (query.price.length) conditions.push(inArray(recipes.price, query.price));
  if (query.maxMinutes !== undefined) conditions.push(lte(recipes.timeMinutes, query.maxMinutes));

  const rows = db
    .select()
    .from(recipes)
    .where(and(...conditions))
    .orderBy(desc(recipes.updatedAt), desc(recipes.id))
    .limit(LIST_LIMIT)
    .all();
  if (rows.length === 0) return [];

  const flavorRows = db
    .select({ recipeId: ingredientGroups.recipeId, flavors: ingredientLines.flavors })
    .from(ingredientLines)
    .innerJoin(ingredientGroups, eq(ingredientGroups.id, ingredientLines.groupId))
    .where(
      inArray(
        ingredientGroups.recipeId,
        rows.map((row) => row.id),
      ),
    )
    .all();
  const flavorsByRecipe = new Map<number, Set<Flavor>>();
  for (const { recipeId, flavors } of flavorRows) {
    const set = flavorsByRecipe.get(recipeId) ?? new Set<Flavor>();
    for (const flavor of JSON.parse(flavors) as Flavor[]) set.add(flavor);
    flavorsByRecipe.set(recipeId, set);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    timeMinutes: row.timeMinutes,
    servings: row.servings,
    rating: { taste: row.taste, difficulty: row.difficulty, price: row.price },
    flavors: FLAVORS.filter((flavor) => flavorsByRecipe.get(row.id)?.has(flavor)),
    updatedAt: row.updatedAt,
  }));
}
