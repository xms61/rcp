import { checkConnection } from './check';

const token = 'test-token-0123456789abcdef0123456789abcdef';
const url = 'https://rcp.example.org';

function fakeFetch(responses: Record<string, number | Error>) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fetchFn = (input: string, init?: { headers?: Record<string, string> }) => {
    calls.push({ url: input, headers: init?.headers ?? {} });
    const answer = responses[input];
    if (answer instanceof Error) return Promise.reject(answer);
    return Promise.resolve(new Response(null, { status: answer ?? 404 }));
  };
  return { fetchFn, calls };
}

describe('checkConnection', () => {
  test('is connected when the API answers and accepts the token', async () => {
    const { fetchFn } = fakeFetch({ [`${url}/healthz`]: 200, [`${url}/api/ping`]: 200 });
    expect(await checkConnection(url, token, fetchFn)).toEqual({ kind: 'connected' });
  });

  test('sends the token only in the Authorization header, never in the address', async () => {
    const { fetchFn, calls } = fakeFetch({ [`${url}/healthz`]: 200, [`${url}/api/ping`]: 200 });
    await checkConnection(url, token, fetchFn);
    expect(calls.map((call) => call.url)).toEqual([`${url}/healthz`, `${url}/api/ping`]);
    expect(calls[0]?.headers).toEqual({});
    expect(calls[1]?.headers).toEqual({ Authorization: `Bearer ${token}` });
  });

  test('reports a rejected token separately from an unreachable API', async () => {
    const { fetchFn } = fakeFetch({ [`${url}/healthz`]: 200, [`${url}/api/ping`]: 401 });
    expect(await checkConnection(url, token, fetchFn)).toEqual({ kind: 'rejected' });
  });

  test('reports an unreachable API without trying the token', async () => {
    const { fetchFn, calls } = fakeFetch({ [`${url}/healthz`]: new TypeError('Network request failed') });
    expect(await checkConnection(url, token, fetchFn)).toEqual({ kind: 'unreachable' });
    expect(calls).toHaveLength(1);
  });

  test('reports any other answer by its status', async () => {
    const { fetchFn } = fakeFetch({ [`${url}/healthz`]: 502 });
    expect(await checkConnection(url, token, fetchFn)).toEqual({ kind: 'failed', status: 502 });
  });
});
