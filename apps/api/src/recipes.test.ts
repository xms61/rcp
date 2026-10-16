import type { Recipe, RecipeSummary } from '@rcp/domain';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp } from './app';
import { openTestDatabase } from './test-db';

const token = 'test-token-0123456789abcdef0123456789abcdef';
const auth = { Authorization: `Bearer ${token}` };

let database: ReturnType<typeof openTestDatabase>;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  database = openTestDatabase();
  app = createApp({ token, db: database.db });
});
afterEach(() => {
  database.close();
});

const pasta = {
  title: 'Pasta e ceci',
  description: 'Roman chickpea and pasta stew.',
  servings: 4,
  timeMinutes: 40,
  rating: { taste: 4, difficulty: 'easy', price: 1 },
  groups: [
    {
      title: 'Base',
      lines: [
        { amount: 30, unit: 'g', food: 'olive oil', flavors: ['fat'] },
        { amount: 1, unit: 'piece', food: 'onion', note: 'diced' },
      ],
    },
    {
      title: 'Pasta and beans',
      lines: [
        { amount: 480, unit: 'g', food: 'chickpeas, cooked' },
        { amount: null, unit: null, food: 'salt', note: 'to taste', flavors: ['salty'] },
      ],
    },
  ],
  steps: [{ text: 'Warm the olive oil and soften the onion.', timerSeconds: 480 }, { text: 'Add the chickpeas.' }],
};

const soup = {
  title: 'Mushroom soup',
  servings: 2,
  timeMinutes: 30,
  rating: { taste: 3, difficulty: 'medium', price: 2 },
  groups: [{ lines: [{ amount: 300, unit: 'g', food: 'mushrooms' }] }],
  steps: [{ text: 'Simmer.' }],
};

function send(method: string, path: string, body?: unknown, headers: Record<string, string> = auth) {
  return app.request(path, {
    method,
    headers: { ...headers, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function create(body: unknown) {
  const response = await send('POST', '/api/recipes', body);
  expect(response.status).toBe(201);
  return (await response.json()) as Recipe;
}

async function list(query = '') {
  const response = await send('GET', `/api/recipes${query}`);
  expect(response.status).toBe(200);
  return ((await response.json()) as { recipes: RecipeSummary[] }).recipes.map((r) => r.title);
}

describe('POST /api/recipes', () => {
  test('stores a recipe and answers with it, its id, defaults and timestamps', async () => {
    const response = await send('POST', '/api/recipes', pasta);
    expect(response.status).toBe(201);
    const recipe = (await response.json()) as Recipe;
    expect(response.headers.get('Location')).toBe(`/api/recipes/${String(recipe.id)}`);
    expect(recipe.id).toBeGreaterThan(0);
    expect(recipe.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(recipe.updatedAt).toBe(recipe.createdAt);
    expect(recipe.serving).toEqual({ kind: 'share' });
    expect(recipe.groups.map((g) => g.title)).toEqual(['Base', 'Pasta and beans']);
    expect(recipe.groups[1]?.lines[1]).toEqual({
      amount: null,
      unit: null,
      food: 'salt',
      note: 'to taste',
      original: '',
      flavors: ['salty'],
    });
    expect(recipe.steps).toEqual([
      { text: 'Warm the olive oil and soften the onion.', timerSeconds: 480 },
      { text: 'Add the chickpeas.', timerSeconds: null },
    ]);
  });

  test('keeps every serving kind', async () => {
    for (const serving of [
      { kind: 'weight', grams: 350 },
      { kind: 'pieces', count: 10 },
    ]) {
      expect((await create({ ...pasta, serving, finishedWeightGrams: 1600 })).serving).toEqual(serving);
    }
  });

  test('rejects an invalid recipe with 400 and says which field is wrong', async () => {
    const response = await send('POST', '/api/recipes', { ...pasta, servings: 0 });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; issues: { path: string }[] };
    expect(body.error).toBe('Invalid request');
    expect(body.issues.map((issue) => issue.path)).toContain('servings');
  });

  test('rejects a field the schema does not know, such as an id', async () => {
    expect((await send('POST', '/api/recipes', { ...pasta, id: 99 })).status).toBe(400);
  });

  test('rejects a body that is not JSON', async () => {
    const response = await app.request('/api/recipes', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(response.status).toBe(400);
  });

  test('rejects a body over 1 MB with 413', async () => {
    const response = await send('POST', '/api/recipes', { ...pasta, description: 'x'.repeat(1_100_000) });
    expect(response.status).toBe(413);
  });
});

describe('GET /api/recipes/:id', () => {
  test('answers the recipe as stored', async () => {
    const created = await create(pasta);
    const response = await send('GET', `/api/recipes/${String(created.id)}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(created);
  });

  test('answers 404 for a recipe that does not exist', async () => {
    expect((await send('GET', '/api/recipes/12345')).status).toBe(404);
  });

  test('answers 400 for an id that is not a positive whole number', async () => {
    for (const id of ['abc', '0', '-1', '1.5']) expect((await send('GET', `/api/recipes/${id}`)).status).toBe(400);
  });
});

describe('PUT /api/recipes/:id', () => {
  test('replaces the recipe with its lines and steps, and keeps the id and creation time', async () => {
    const created = await create(pasta);
    const changed = { ...soup, title: 'Pasta e ceci, v2' };
    const response = await send('PUT', `/api/recipes/${String(created.id)}`, changed);
    expect(response.status).toBe(200);
    const updated = (await response.json()) as Recipe;
    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
    expect(updated.groups).toEqual([{ title: '', lines: [expect.objectContaining({ food: 'mushrooms' })] }]);
    expect(updated.steps).toEqual([{ text: 'Simmer.', timerSeconds: null }]);
    const stored = await send('GET', `/api/recipes/${String(created.id)}`);
    expect(await stored.json()).toEqual(updated);
  });

  test('leaves no lines or steps behind from the old version', async () => {
    const created = await create(pasta);
    await send('PUT', `/api/recipes/${String(created.id)}`, soup);
    const counts = ['ingredient_groups', 'ingredient_lines', 'steps'].map(
      (table) => database.sqlite.prepare(`select count(*) as n from ${table}`).get() as { n: number },
    );
    expect(counts.map((c) => c.n)).toEqual([1, 1, 1]);
  });

  test('answers 404 for a recipe that does not exist, and creates nothing', async () => {
    expect((await send('PUT', '/api/recipes/777', soup)).status).toBe(404);
    expect(await list()).toEqual([]);
  });

  test('rejects an invalid recipe and keeps the old one', async () => {
    const created = await create(pasta);
    expect((await send('PUT', `/api/recipes/${String(created.id)}`, { ...soup, title: '' })).status).toBe(400);
    expect(await list()).toEqual(['Pasta e ceci']);
  });
});

describe('DELETE /api/recipes/:id', () => {
  test('deletes the recipe, then answers 404 for it', async () => {
    const created = await create(pasta);
    expect((await send('DELETE', `/api/recipes/${String(created.id)}`)).status).toBe(204);
    expect((await send('GET', `/api/recipes/${String(created.id)}`)).status).toBe(404);
    expect((await send('DELETE', `/api/recipes/${String(created.id)}`)).status).toBe(404);
  });
});

describe('GET /api/recipes', () => {
  test('lists summaries, the latest change first, with the flavors of all lines', async () => {
    await create(pasta);
    await create(soup);
    const response = await send('GET', '/api/recipes');
    const { recipes } = (await response.json()) as { recipes: RecipeSummary[] };
    expect(recipes.map((r) => r.title)).toEqual(['Mushroom soup', 'Pasta e ceci']);
    expect(recipes[1]).toEqual({
      id: expect.any(Number) as number,
      title: 'Pasta e ceci',
      timeMinutes: 40,
      servings: 4,
      rating: { taste: 4, difficulty: 'easy', price: 1 },
      flavors: ['salty', 'fat'],
      updatedAt: expect.any(String) as string,
    });
  });

  test('searches titles and foods, ignoring case', async () => {
    await create(pasta);
    await create(soup);
    expect(await list('?q=CECI')).toEqual(['Pasta e ceci']);
    expect(await list('?q=mushroom')).toEqual(['Mushroom soup']);
    expect(await list('?q=chickpeas')).toEqual(['Pasta e ceci']);
  });

  test('treats % and _ in a search as plain characters', async () => {
    await create(pasta);
    expect(await list('?q=%25')).toEqual([]);
    expect(await list('?q=_')).toEqual([]);
  });

  test('includes and excludes by food, every included food required', async () => {
    await create(pasta);
    await create(soup);
    expect(await list('?with=chickpeas')).toEqual(['Pasta e ceci']);
    expect(await list('?with=chickpeas&with=onion')).toEqual(['Pasta e ceci']);
    expect(await list('?with=chickpeas&with=mushrooms')).toEqual([]);
    expect(await list('?without=mushrooms')).toEqual(['Pasta e ceci']);
  });

  test('filters by taste, difficulty, price and time', async () => {
    await create(pasta);
    await create(soup);
    await create({
      ...soup,
      title: 'Quick salad',
      timeMinutes: null,
      rating: { taste: null, difficulty: null, price: null },
    });
    expect(await list('?tasteMin=4')).toEqual(['Pasta e ceci']);
    expect(await list('?difficulty=medium')).toEqual(['Mushroom soup']);
    expect(await list('?difficulty=easy&difficulty=medium')).toEqual(['Mushroom soup', 'Pasta e ceci']);
    expect(await list('?price=2')).toEqual(['Mushroom soup']);
    expect(await list('?maxMinutes=35')).toEqual(['Mushroom soup']);
  });

  test('answers 400 for a filter it cannot read', async () => {
    expect((await send('GET', '/api/recipes?tasteMin=nine')).status).toBe(400);
    expect((await send('GET', '/api/recipes?unknown=1')).status).toBe(400);
  });
});

describe('the recipe routes', () => {
  test('need the token, like every /api route', async () => {
    const created = await create(pasta);
    for (const [method, path] of [
      ['GET', '/api/recipes'],
      ['POST', '/api/recipes'],
      ['GET', `/api/recipes/${String(created.id)}`],
      ['PUT', `/api/recipes/${String(created.id)}`],
      ['DELETE', `/api/recipes/${String(created.id)}`],
    ] as const) {
      expect((await send(method, path, method === 'POST' || method === 'PUT' ? soup : undefined, {})).status).toBe(401);
    }
    expect(await list()).toEqual(['Pasta e ceci']);
  });
});

describe('search with letters beyond ASCII', () => {
  test('ignores case for accented capitals too, in titles and foods', async () => {
    await create({
      ...soup,
      title: 'Älplermagronen',
      groups: [{ lines: [{ amount: 2, unit: 'piece', food: 'Äpfel' }] }],
    });
    expect(await list('?q=älpler')).toEqual(['Älplermagronen']);
    expect(await list('?q=ÄLPLER')).toEqual(['Älplermagronen']);
    expect(await list('?with=äpfel')).toEqual(['Älplermagronen']);
    expect(await list('?without=ÄPFEL')).toEqual([]);
  });
});

describe('the list order', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('puts the latest change first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T10:00:00Z'));
    const first = await create(pasta);
    vi.setSystemTime(new Date('2026-10-16T11:00:00Z'));
    await create(soup);
    expect(await list()).toEqual(['Mushroom soup', 'Pasta e ceci']);
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    await send('PUT', `/api/recipes/${String(first.id)}`, pasta);
    expect(await list()).toEqual(['Pasta e ceci', 'Mushroom soup']);
  });
});

describe('an unexpected error', () => {
  test('answers a bare 500 and keeps the recipe out of the log', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      // Fails the insert itself, with the values bound, as a full disk or a held lock would.
      database.sqlite.exec("create trigger fail before insert on recipes begin select raise(abort, 'disk full'); end");
      const response = await send('POST', '/api/recipes', { ...pasta, title: 'Secret family stew' });
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Something went wrong' });
      expect(spy).toHaveBeenCalled();
      const logged = JSON.stringify(spy.mock.calls);
      expect(logged).not.toContain('Secret family stew');
      expect(logged).not.toContain('olive oil');
      expect(logged).toContain('disk full');
    } finally {
      spy.mockRestore();
    }
  });
});
