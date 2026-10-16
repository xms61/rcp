import { zValidator } from '@hono/zod-validator';
import { recipeInputSchema, recipeQuerySchema } from '@rcp/domain';
import { Hono, type Context } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { z } from 'zod';
import type { Db } from './db/database';
import { createRecipe, deleteRecipe, getRecipe, listRecipes, replaceRecipe } from './db/recipes';

export interface AppOptions {
  /** The one API token the app sends as `Authorization: Bearer <token>` (design-docs/mobile-app-and-api.md). */
  token: string;
  db: Db;
}

// A recipe at every limit in packages/domain/src/recipe.ts is about 400 KB of JSON.
const MAX_BODY_BYTES = 1024 * 1024;

const idParam = z.strictObject({ id: z.coerce.number().int().positive() });

/** Answers a failed validation with 400 and where it failed, never echoing the input back. */
function invalid(
  result:
    { success: true } | { success: false; error: { issues: readonly { path: PropertyKey[]; message: string }[] } },
  c: Context,
) {
  if (result.success) return;
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  return c.json({ error: 'Invalid request', issues }, 400);
}

const notFound = (c: Context) => c.json({ error: 'Recipe not found' }, 404);

/**
 * The error's name and message, safe to log. A DrizzleQueryError's message holds the query's bound values, which can
 * be recipe text, so for it only the underlying SQLite error is described.
 */
export function describeError(error: Error): string {
  if (error instanceof DrizzleQueryError) {
    const cause = error.cause instanceof Error ? error.cause : undefined;
    if (!cause) return 'DrizzleQueryError';
    const code = (cause as { code?: unknown }).code;
    return `DrizzleQueryError: ${cause.name}${typeof code === 'string' ? ` ${code}` : ''}: ${cause.message}`;
  }
  return `${error.name}: ${error.message}`;
}

export function createApp({ token, db }: AppOptions) {
  const app = new Hono();

  // Open, so an uptime check or the container's health check needs no secret. It says nothing about the data.
  app.get('/healthz', (c) => c.text('ok'));

  // Every data route lives under /api and needs the token, checked before routing, so an unknown route without a
  // token also answers 401. bearerAuth compares in constant time.
  app.use('/api/*', bearerAuth({ token }));
  app.use(
    '/api/*',
    bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => c.json({ error: 'Request too large' }, 413) }),
  );
  app.get('/api/ping', (c) => c.json({ ok: true }));

  app.get('/api/recipes', zValidator('query', recipeQuerySchema, invalid), (c) =>
    c.json({ recipes: listRecipes(db, c.req.valid('query')) }),
  );

  app.post('/api/recipes', zValidator('json', recipeInputSchema, invalid), (c) => {
    const recipe = createRecipe(db, c.req.valid('json'));
    c.header('Location', `/api/recipes/${String(recipe.id)}`);
    return c.json(recipe, 201);
  });

  app.get('/api/recipes/:id', zValidator('param', idParam, invalid), (c) => {
    const recipe = getRecipe(db, c.req.valid('param').id);
    return recipe ? c.json(recipe) : notFound(c);
  });

  app.put(
    '/api/recipes/:id',
    zValidator('param', idParam, invalid),
    zValidator('json', recipeInputSchema, invalid),
    (c) => {
      const recipe = replaceRecipe(db, c.req.valid('param').id, c.req.valid('json'));
      return recipe ? c.json(recipe) : notFound(c);
    },
  );

  app.delete('/api/recipes/:id', zValidator('param', idParam, invalid), (c) =>
    deleteRecipe(db, c.req.valid('param').id) ? c.body(null, 204) : notFound(c),
  );

  // An unexpected error answers 500 without details. The log gets what failed, never the request, its headers or
  // the data (docs/SECURITY.md).
  app.onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse();
    console.error('Unexpected error:', describeError(error));
    return c.json({ error: 'Something went wrong' }, 500);
  });

  return app;
}
