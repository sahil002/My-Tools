import type { IncomingMessage, ServerResponse } from 'http';
import { clearSessionCookie, sendJson } from '../_lib/adminAuthServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  clearSessionCookie(res);
  return sendJson(res, 200, {
    success: true,
    message: 'Logged out successfully',
  });
}
