import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';

export interface AppOptions {
  /** The one API token the app sends as `Authorization: Bearer <token>` (design-docs/mobile-app-and-api.md). */
  token: string;
}

export function createApp({ token }: AppOptions) {
  const app = new Hono();

  // Open, so an uptime check or the container's health check needs no secret. It says nothing about the data.
  app.get('/healthz', (c) => c.text('ok'));

  // Every data route lives under /api and needs the token, checked before routing, so an unknown route without a
  // token also answers 401. bearerAuth compares in constant time.
  app.use('/api/*', bearerAuth({ token }));
  app.get('/api/ping', (c) => c.json({ ok: true }));

  return app;
}
