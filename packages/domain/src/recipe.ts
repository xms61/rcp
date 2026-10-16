import { z } from 'zod';
import { UNITS } from './units';

// The shape of a recipe as the app sends it and the API stores it (apps/mobile/PRODUCT.md). Both sides validate
// with these schemas, so a rule changes in one place. Limits keep one request small and the screens readable, and
// strict objects reject a field they don't know instead of dropping it.

export const FLAVORS = ['salty', 'fat', 'acid', 'sweet', 'heat'] as const;
export type Flavor = (typeof FLAVORS)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

const MAX_LINES = 200;

const unique = (values: readonly unknown[]) => new Set(values).size === values.length;

export const ingredientLineSchema = z
  .strictObject({
    // Null for a line such as "salt, to taste".
    amount: z.number().positive().max(100_000).nullable(),
    unit: z.enum(UNITS).nullable(),
    // The food as written, until the food tables let a line link to one.
    food: z.string().trim().min(1).max(200),
    note: z.string().trim().max(200).default(''),
    // The line as the source wrote it, kept so it can be parsed or linked again later.
    original: z.string().trim().max(500).default(''),
    flavors: z.array(z.enum(FLAVORS)).max(FLAVORS.length).refine(unique, 'Each flavor once.').default([]),
  })
  .refine((line) => line.unit === null || line.amount !== null, {
    message: 'A unit needs an amount.',
    path: ['unit'],
  });
export type IngredientLine = z.infer<typeof ingredientLineSchema>;

export const ingredientGroupSchema = z.strictObject({
  title: z.string().trim().max(100).default(''),
  lines: z.array(ingredientLineSchema).max(100),
});
export type IngredientGroup = z.infer<typeof ingredientGroupSchema>;

export const stepSchema = z.strictObject({
  text: z.string().trim().min(1).max(2000),
  timerSeconds: z.number().int().positive().max(86_400).nullable().default(null),
});
export type Step = z.infer<typeof stepSchema>;

/** What one serving is, for nutrition: a share of the recipe, a weight of the finished dish, or a piece. */
export const servingSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('share') }),
  z.strictObject({ kind: z.literal('weight'), grams: z.number().positive().max(10_000) }),
  z.strictObject({ kind: z.literal('pieces'), count: z.number().int().positive().max(1000) }),
]);
export type Serving = z.infer<typeof servingSchema>;

/** The owner's own rating; every part is optional. Price is 1 to 3, shown as € to €€€. */
export const ratingSchema = z.strictObject({
  taste: z.number().int().min(1).max(5).nullable(),
  difficulty: z.enum(DIFFICULTIES).nullable(),
  price: z.number().int().min(1).max(3).nullable(),
});
export type Rating = z.infer<typeof ratingSchema>;

export const recipeInputSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).default(''),
    servings: z.number().int().min(1).max(100),
    timeMinutes: z.number().int().min(1).max(2880).nullable().default(null),
    serving: servingSchema.default({ kind: 'share' }),
    // Cooking changes the weight, so it is entered, not summed; per-100 g nutrition needs it.
    finishedWeightGrams: z.number().positive().max(100_000).nullable().default(null),
    rating: ratingSchema.default({ taste: null, difficulty: null, price: null }),
    groups: z.array(ingredientGroupSchema).max(20),
    steps: z.array(stepSchema).max(100),
  })
  .refine((recipe) => recipe.groups.reduce((sum, group) => sum + group.lines.length, 0) <= MAX_LINES, {
    message: `At most ${String(MAX_LINES)} ingredient lines.`,
    path: ['groups'],
  });
export type RecipeInput = z.infer<typeof recipeInputSchema>;

export interface Recipe extends RecipeInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/** One row of the recipe list. */
export interface RecipeSummary {
  id: number;
  title: string;
  timeMinutes: number | null;
  servings: number;
  rating: Rating;
  flavors: Flavor[];
  updatedAt: string;
}

// A query string arrives as strings, and as a single string when a key appears once, so the list filters coerce.
const list = <T extends z.ZodType>(item: T, max: number) =>
  z.preprocess((value) => (value === undefined ? [] : [value].flat()), z.array(item).max(max));

const foodFilter = list(z.string().trim().min(1).max(100), 10);

/** The recipe list's search and filters (the Filter screen). Ingredient filters match the food as written. */
export const recipeQuerySchema = z.strictObject({
  q: z.string().trim().max(100).optional(),
  with: foodFilter,
  without: foodFilter,
  tasteMin: z.coerce.number().int().min(1).max(5).optional(),
  difficulty: list(z.enum(DIFFICULTIES), DIFFICULTIES.length),
  price: list(z.coerce.number().int().min(1).max(3), 3),
  maxMinutes: z.coerce.number().int().min(1).max(2880).optional(),
});
export type RecipeQuery = z.infer<typeof recipeQuerySchema>;
