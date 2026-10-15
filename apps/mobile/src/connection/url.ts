export type ParsedApiUrl = { ok: true; url: string } | { ok: false; error: string };

const NOT_AN_ADDRESS = 'Enter the API address, such as https://rcp.example.org.';

/**
 * Checks the API address the owner typed. Release builds accept only https, so the token never travels in clear
 * text; development builds also accept http, for an API running on the PC.
 */
export function parseApiUrl(input: string, { allowHttp }: { allowHttp: boolean }): ParsedApiUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, error: NOT_AN_ADDRESS };
  }
  const plainOrigin = url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  if (!plainOrigin || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    return { ok: false, error: NOT_AN_ADDRESS };
  }
  if (url.protocol === 'http:' && !allowHttp) return { ok: false, error: 'Use an https:// address.' };
  return { ok: true, url: url.origin };
}
