import { describe, expect, test } from 'vitest';
import { recipeInputSchema, recipeQuerySchema } from './recipe';

const minimal = {
  title: '  Pasta e ceci ',
  servings: 4,
  groups: [{ title: 'Base', lines: [{ amount: 30, unit: 'g', food: 'olive oil' }] }],
  steps: [{ text: 'Warm the olive oil.' }],
};

describe('recipeInputSchema', () => {
  test('fills in the defaults and trims text', () => {
    const recipe = recipeInputSchema.parse(minimal);
    expect(recipe.title).toBe('Pasta e ceci');
    expect(recipe.description).toBe('');
    expect(recipe.timeMinutes).toBeNull();
    expect(recipe.serving).toEqual({ kind: 'share' });
    expect(recipe.finishedWeightGrams).toBeNull();
    expect(recipe.rating).toEqual({ taste: null, difficulty: null, price: null });
    expect(recipe.groups[0]?.lines[0]).toEqual({
      amount: 30,
      unit: 'g',
      food: 'olive oil',
      note: '',
      original: '',
      flavors: [],
    });
    expect(recipe.steps[0]).toEqual({ text: 'Warm the olive oil.', timerSeconds: null });
  });

  test('accepts a line without an amount, such as "salt, to taste"', () => {
    const lines = [{ amount: null, unit: null, food: 'salt', note: 'to taste', flavors: ['salty'] }];
    expect(recipeInputSchema.safeParse({ ...minimal, groups: [{ lines }] }).success).toBe(true);
  });

  test('accepts each kind of serving and a full rating', () => {
    for (const serving of [{ kind: 'share' }, { kind: 'weight', grams: 350 }, { kind: 'pieces', count: 10 }]) {
      const result = recipeInputSchema.safeParse({
        ...minimal,
        serving,
        rating: { taste: 5, difficulty: 'hard', price: 3 },
      });
      expect(result.success).toBe(true);
    }
  });

  test.each([
    ['an empty title', { title: '   ' }],
    ['zero servings', { servings: 0 }],
    ['fractional servings', { servings: 2.5 }],
    ['a taste above 5', { rating: { taste: 6, difficulty: null, price: null } }],
    ['a price above 3', { rating: { taste: null, difficulty: null, price: 4 } }],
    ['an unknown difficulty', { rating: { taste: null, difficulty: 'expert', price: null } }],
    ['a serving of zero pieces', { serving: { kind: 'pieces', count: 0 } }],
    ['a serving of negative grams', { serving: { kind: 'weight', grams: -1 } }],
    ['an unknown serving kind', { serving: { kind: 'bowls' } }],
    ['an empty step', { steps: [{ text: ' ' }] }],
  ])('rejects %s', (_, change) => {
    expect(recipeInputSchema.safeParse({ ...minimal, ...change }).success).toBe(false);
  });

  test.each([
    ['a unit without an amount', { amount: null, unit: 'g', food: 'flour' }],
    ['an unknown unit', { amount: 1, unit: 'handful', food: 'herbs' }],
    ['a negative amount', { amount: -2, unit: 'g', food: 'flour' }],
    ['an empty food name', { amount: 1, unit: 'g', food: '' }],
    ['an unknown flavor', { amount: 1, unit: 'g', food: 'sugar', flavors: ['umami'] }],
    ['a flavor twice', { amount: 1, unit: 'g', food: 'salt', flavors: ['salty', 'salty'] }],
  ])('rejects a line with %s', (_, line) => {
    expect(recipeInputSchema.safeParse({ ...minimal, groups: [{ lines: [line] }] }).success).toBe(false);
  });

  test('accepts 200 ingredient lines in all and rejects 201, so a request stays small', () => {
    const lines = (n: number) => Array.from({ length: n }, () => ({ amount: 1, unit: 'g', food: 'x' }));
    const groups200 = [{ lines: lines(100) }, { lines: lines(100) }];
    expect(recipeInputSchema.safeParse({ ...minimal, groups: groups200 }).success).toBe(true);
    const groups201 = [...groups200, { lines: lines(1) }];
    expect(recipeInputSchema.safeParse({ ...minimal, groups: groups201 }).success).toBe(false);
  });

  test('rejects a field it does not know, at any level', () => {
    expect(recipeInputSchema.safeParse({ ...minimal, id: 7 }).success).toBe(false);
    const line = { amount: 1, unit: 'g', food: 'x', foodId: 3 };
    expect(recipeInputSchema.safeParse({ ...minimal, groups: [{ lines: [line] }] }).success).toBe(false);
  });
});

describe('recipeQuerySchema', () => {
  test('is empty by default', () => {
    expect(recipeQuerySchema.parse({})).toEqual({ with: [], without: [], difficulty: [], price: [] });
  });

  test('accepts every filter', () => {
    const query = {
      q: 'soup',
      with: ['chickpeas'],
      without: ['mushrooms'],
      tasteMin: 4,
      difficulty: ['easy', 'medium'],
      price: [1, 2],
      maxMinutes: 45,
    };
    expect(recipeQuerySchema.parse(query)).toEqual(query);
  });

  test('reads a query string as Hono hands it over: strings, and a single value for a key given once', () => {
    expect(
      recipeQuerySchema.parse({
        tasteMin: '4',
        maxMinutes: '45',
        with: 'chickpeas',
        price: ['1', '2'],
        difficulty: 'easy',
      }),
    ).toEqual({ with: ['chickpeas'], without: [], tasteMin: 4, maxMinutes: 45, price: [1, 2], difficulty: ['easy'] });
  });

  test.each([
    ['a taste filter that is not a number', { tasteMin: 'great' }],
    ['a taste filter above 5', { tasteMin: 6 }],
    ['more than 10 included ingredients', { with: Array.from({ length: 11 }, (_, i) => `food ${String(i)}`) }],
    ['a search over 100 characters', { q: 'x'.repeat(101) }],
  ])('rejects %s', (_, query) => {
    expect(recipeQuerySchema.safeParse(query).success).toBe(false);
  });
});
