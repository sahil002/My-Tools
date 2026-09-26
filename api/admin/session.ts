import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, sendJson } from '../_lib/adminAuthServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const user = getAuthenticatedAdminFromRequest(req);
  if (!user) {
    return sendJson(res, 401, {
      authenticated: false,
      error: 'Unauthenticated or session expired.',
    });
  }

  return sendJson(res, 200, {
    authenticated: true,
    user,
  });
}
