import { parseApiUrl } from './url';

describe('parseApiUrl', () => {
  test('accepts an https address and drops a trailing slash', () => {
    expect(parseApiUrl('https://rcp.example.org/', { allowHttp: false })).toEqual({
      ok: true,
      url: 'https://rcp.example.org',
    });
    expect(parseApiUrl('  https://rcp.example.org  ', { allowHttp: false })).toEqual({
      ok: true,
      url: 'https://rcp.example.org',
    });
  });

  test('refuses http in a release build, so the token never crosses the network in clear text', () => {
    expect(parseApiUrl('http://192.168.1.20:3000', { allowHttp: false })).toEqual({
      ok: false,
      error: 'Use an https:// address.',
    });
  });

  test('allows http in development, for an API running on the PC', () => {
    expect(parseApiUrl('http://192.168.1.20:3000', { allowHttp: true })).toEqual({
      ok: true,
      url: 'http://192.168.1.20:3000',
    });
  });

  test('refuses other schemes, addresses with a path or query, and text that is not an address', () => {
    const error = { ok: false, error: 'Enter the API address, such as https://rcp.example.org.' };
    expect(parseApiUrl('ftp://rcp.example.org', { allowHttp: true })).toEqual(error);
    expect(parseApiUrl('rcp.example.org', { allowHttp: true })).toEqual(error);
    expect(parseApiUrl('', { allowHttp: true })).toEqual(error);
    expect(parseApiUrl('https://rcp.example.org/api?token=x', { allowHttp: true })).toEqual(error);
    expect(parseApiUrl('https://user:pass@rcp.example.org', { allowHttp: true })).toEqual(error);
  });
});
