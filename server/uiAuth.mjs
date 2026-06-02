/**
 * Bearer token extraction for the UI proxy.
 */

/**
 * @param {import('node:http').IncomingMessage} req
 */
export function readBearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return '';
  return auth.slice(7).trim();
}
