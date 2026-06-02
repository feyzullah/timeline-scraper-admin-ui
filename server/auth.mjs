/**
 * @param {import('node:http').IncomingMessage} req
 */
export function readBearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return '';
  return auth.slice(7).trim();
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} expectedKey - ADMIN_UI_API_KEY
 * @returns {boolean} true when request may proceed
 */
export function requireUiApiKey(req, res, expectedKey) {
  if (!expectedKey) return true;

  const token = readBearerToken(req);
  if (token === expectedKey) return true;

  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Unauthorized' }));
  return false;
}
