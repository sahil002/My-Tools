import type { IncomingMessage, ServerResponse } from 'http';
import { getSupabaseServerClient } from './_lib/supabaseServer.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (_req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method not allowed.' }));
  }
  const supabase = getSupabaseServerClient(true);
  if (!supabase) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, aiEnabled: false, imageUploadEnabled: false }));
  }
  try {
    const { data, error } = await supabase.from('math_ai_config').select('ai_enabled,image_upload_enabled').eq('id', 1).maybeSingle();
    if (error) throw error;
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      aiEnabled: Boolean(data?.ai_enabled),
      imageUploadEnabled: Boolean(data?.ai_enabled && data?.image_upload_enabled),
    }));
  } catch {
    // Fail closed: if configuration cannot be read, hide optional AI features.
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, aiEnabled: false, imageUploadEnabled: false }));
  }
}
