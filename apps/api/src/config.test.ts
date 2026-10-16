import { describe, expect, test } from 'vitest';
import { loadConfig } from './config';

const token = 'a'.repeat(32);

describe('loadConfig', () => {
  test('reads the token, listens on localhost:3000 and keeps the database in rcp.db by default', () => {
    expect(loadConfig({ RCP_API_TOKEN: token })).toEqual({ token, host: '127.0.0.1', port: 3000, dbPath: 'rcp.db' });
  });

  test('takes the database path from RCP_DB_PATH', () => {
    expect(loadConfig({ RCP_API_TOKEN: token, RCP_DB_PATH: '/data/rcp.db' }).dbPath).toBe('/data/rcp.db');
  });

  test('takes HOST and PORT from the environment', () => {
    expect(loadConfig({ RCP_API_TOKEN: token, HOST: '0.0.0.0', PORT: '8080' })).toEqual({
      token,
      host: '0.0.0.0',
      port: 8080,
      dbPath: 'rcp.db',
    });
  });

  test('refuses to start without a token, and says how to make one', () => {
    expect(() => loadConfig({})).toThrow(/RCP_API_TOKEN is not set.*openssl rand -hex 32/);
  });

  test('refuses a token shorter than 32 characters', () => {
    expect(() => loadConfig({ RCP_API_TOKEN: 'short' })).toThrow(/at least 32 characters/);
  });

  test('refuses a port that is not a number', () => {
    expect(() => loadConfig({ RCP_API_TOKEN: token, PORT: 'http' })).toThrow(/PORT must be a port number/);
  });
});
