import type { IncomingMessage, ServerResponse } from 'http';
import {
  getAuthenticatedAdminFromRequest,
  getAdminServerConfig,
  timingSafeCompare,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  // 1. Verify authenticated admin
  const user = getAuthenticatedAdminFromRequest(req);
  if (!user) {
    return sendJson(res, 401, {
      success: false,
      error: 'Unauthorized: Admin authentication required.',
    });
  }

  // 2. Parse body
  const body = await parseJsonBody<{ currentPassword?: string; newPassword?: string }>(req);
  if (!body || !body.newPassword) {
    return sendJson(res, 400, {
      success: false,
      error: 'New password is required.',
    });
  }

  if (body.newPassword.length < 8) {
    return sendJson(res, 400, {
      success: false,
      error: 'Password must be at least 8 characters long.',
    });
  }

  const { password: currentServerPassword } = getAdminServerConfig();

  // If current password provided, verify it
  if (body.currentPassword && !timingSafeCompare(body.currentPassword, currentServerPassword)) {
    return sendJson(res, 403, {
      success: false,
      error: 'Current password does not match.',
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: 'Password validation successful. To persist permanently in production, update ADMIN_PASSWORD in your Vercel Project Environment Variables.',
  });
}
