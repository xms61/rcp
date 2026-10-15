import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadConfig } from './config';

let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
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
    server.close(() => process.exit(0));
  });
}
