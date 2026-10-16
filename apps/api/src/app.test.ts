import { DrizzleQueryError } from 'drizzle-orm/errors';
import { describe, expect, test } from 'vitest';
import { createApp, describeError } from './app';
import { openTestDatabase } from './test-db';

const token = 'test-token-0123456789abcdef0123456789abcdef';
const app = createApp({ token, db: openTestDatabase().db });

function get(path: string, authorization?: string) {
  return app.request(path, authorization ? { headers: { Authorization: authorization } } : {});
}

describe('GET /healthz', () => {
  test('answers ok without a token, so uptime checks need no secret', async () => {
    const response = await get('/healthz');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });
});

describe('the token on /api routes', () => {
  test('is required', async () => {
    expect((await get('/api/ping')).status).toBe(401);
  });

  test('must match exactly', async () => {
    expect((await get('/api/ping', `Bearer ${token}x`)).status).toBe(401);
    expect((await get('/api/ping', `Bearer ${token.slice(1)}`)).status).toBe(401);
  });

  test('must come as a Bearer token; another scheme is a bad request', async () => {
    expect((await get('/api/ping', `Basic ${token}`)).status).toBe(400);
  });

  test('lets the request through when it matches', async () => {
    const response = await get('/api/ping', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test('is checked before an unknown route answers 404', async () => {
    expect((await get('/api/no-such-route')).status).toBe(401);
  });
});

describe('describeError', () => {
  test("logs a failed query's SQLite error, never its bound values", () => {
    const cause = Object.assign(new Error('database is locked'), { name: 'SqliteError', code: 'SQLITE_BUSY' });
    const error = new DrizzleQueryError('insert into recipes (title) values (?)', ['Secret family stew'], cause);
    const logged = describeError(error);
    expect(logged).toBe('DrizzleQueryError: SqliteError SQLITE_BUSY: database is locked');
    expect(logged).not.toContain('Secret family stew');
  });

  test('logs any other error by its name and message', () => {
    expect(describeError(new TypeError('x is undefined'))).toBe('TypeError: x is undefined');
  });
});
