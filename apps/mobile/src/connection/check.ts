export type ConnectionCheck =
  { kind: 'connected' } | { kind: 'rejected' } | { kind: 'unreachable' } | { kind: 'failed'; status: number };

type FetchFn = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

/**
 * Asks the API whether it is up (`/healthz`, no token), then whether it accepts the token (`/api/ping`). The token
 * goes only in the Authorization header.
 */
export async function checkConnection(
  baseUrl: string,
  token: string,
  fetchFn: FetchFn = fetch,
): Promise<ConnectionCheck> {
  let health: Response;
  try {
    health = await fetchFn(`${baseUrl}/healthz`);
  } catch {
    return { kind: 'unreachable' };
  }
  if (!health.ok) return { kind: 'failed', status: health.status };

  let ping: Response;
  try {
    ping = await fetchFn(`${baseUrl}/api/ping`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return { kind: 'unreachable' };
  }
  if (ping.status === 401) return { kind: 'rejected' };
  if (!ping.ok) return { kind: 'failed', status: ping.status };
  return { kind: 'connected' };
}
