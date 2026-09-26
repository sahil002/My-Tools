import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, sendJson } from '../_lib/adminAuthServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Verify server authentication on every admin data access
  const user = getAuthenticatedAdminFromRequest(req);
  if (!user) {
    return sendJson(res, 401, {
      success: false,
      error: 'Access Denied: Authentication required to access administrative telemetry and operations.',
    });
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      authenticatedAs: user.email,
      serverTimestamp: new Date().toISOString(),
      securityStatus: 'Enforced (Server-Side Session Validated)',
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'Admin operation executed under verified session.',
  });
}
