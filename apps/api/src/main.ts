import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadConfig } from './config';
import { openDatabase } from './db/database';

let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// The migrations sit next to the source in development (src/../drizzle) and next to the bundle in the image
// (dist/../drizzle).
let database;
try {
  database = openDatabase(config.dbPath, new URL('../drizzle/', import.meta.url));
} catch (error) {
  console.error(`Can't open the database at ${config.dbPath}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

const server = serve(
  { fetch: createApp({ token: config.token }).fetch, hostname: config.host, port: config.port },
  () => {
    console.log(`RCP API listening on http://${config.host}:${String(config.port)}`);
  },
);

// docker stop sends SIGTERM: finish open requests, then exit.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => {
      database.close();
      process.exit(0);
    });
  });
}
