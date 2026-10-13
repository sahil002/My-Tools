import type { IncomingMessage, ServerResponse } from 'http';
import { getSupabaseServerClient } from './_lib/supabaseServer.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET') {
    const db = getSupabaseServerClient(false);
    if (!db) { res.statusCode = 503; return res.end(JSON.stringify({ success: false, error: 'Comments unavailable.' })); }
    const url = new URL(req.url || '/', 'http://localhost');
    const slug = String(url.searchParams.get('tool_slug') || '').slice(0, 120);
    let query = db.from('tool_comments').select('id, tool_slug, author_name, comment, rating, status, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(100);
    if (slug) query = query.eq('tool_slug', slug);
    const { data, error } = await query;
    if (error) { res.statusCode = 503; return res.end(JSON.stringify({ success: false, error: 'Comments unavailable.' })); }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, items: data || [] }));
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); res.statusCode = 405; return res.end(JSON.stringify({ success: false, error: 'Method not allowed.' })); }
  let raw = '';
  for await (const chunk of req as any) { raw += chunk.toString(); if (raw.length > 12000) { res.statusCode = 413; return res.end(JSON.stringify({ success: false, error: 'Request too large.' })); } }
  let body: any;
  try { body = JSON.parse(raw || '{}'); } catch { res.statusCode = 400; return res.end(JSON.stringify({ success: false, error: 'Invalid JSON.' })); }
  const tool_slug = String(body.tool_slug || '').trim().slice(0, 120);
  const author_name = String(body.author_name || '').trim().slice(0, 100);
  const author_email = String(body.author_email || '').trim().slice(0, 254);
  const comment = String(body.comment || '').trim().slice(0, 3000);
  const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool_slug) || !author_name || !comment) { res.statusCode = 400; return res.end(JSON.stringify({ success: false, error: 'Valid tool, name and comment are required.' })); }
  const db = getSupabaseServerClient(false);
  if (!db) { res.statusCode = 503; return res.end(JSON.stringify({ success: false, error: 'Comment submission is unavailable.' })); }
  const { error } = await db.from('tool_comments').insert({ tool_slug, author_name, author_email: author_email || null, comment, rating, status: 'pending' });
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (error) { res.statusCode = 503; return res.end(JSON.stringify({ success: false, error: 'Comment submission failed.' })); }
  res.statusCode = 200;
  return res.end(JSON.stringify({ success: true, message: 'Comment submitted for review.' }));
}
