export interface Config {
  token: string;
  host: string;
  port: number;
}

const MIN_TOKEN_LENGTH = 32;

/** Reads the API's settings from the environment, and fails with the fix when one is missing or wrong. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const token = env.RCP_API_TOKEN;
  if (!token) {
    throw new Error('RCP_API_TOKEN is not set. Make one with `openssl rand -hex 32` and put it in .env.');
  }
  if (token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `RCP_API_TOKEN must be at least ${String(MIN_TOKEN_LENGTH)} characters. Make one with \`openssl rand -hex 32\`.`,
    );
  }
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a port number from 1 to 65535, not "${env.PORT ?? ''}".`);
  }
  // Localhost by default, so a development server isn't reachable from the network; the image sets 0.0.0.0.
  return { token, host: env.HOST ?? '127.0.0.1', port };
}
