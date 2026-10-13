import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { getAuthenticatedAdminFromRequest, parseJsonBody, sendJson } from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

function cleanSlug(value: unknown): string { return String(value || '').trim().toLowerCase(); }
function validSlug(slug: string): boolean { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 160; }

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  }
  if (!getAuthenticatedAdminFromRequest(req)) return sendJson(res, 401, { success: false, error: 'Authentication required.' });
  const db = getSupabaseServerClient(true);
  if (!db) return sendJson(res, 503, { success: false, error: 'Secure database configuration is missing.' });
  try {
    if (req.method === 'DELETE') {
      const body = await parseJsonBody<{ slug?: string }>(req);
      const slug = cleanSlug(body?.slug);
      if (!validSlug(slug)) return sendJson(res, 400, { success: false, error: 'Invalid guide slug.' });
      const { error } = await db.from('guides').delete().eq('slug', slug);
      if (error) return sendJson(res, 500, { success: false, error: 'Unable to delete guide.' });
      return sendJson(res, 200, { success: true });
    }
    const body = await parseJsonBody<{ article?: Record<string, any> }>(req);
    const article = body?.article;
    const slug = cleanSlug(article?.slug);
    const title = String(article?.title || '').trim();
    if (!validSlug(slug) || !title || title.length > 240) return sendJson(res, 400, { success: false, error: 'Valid guide title and slug are required.' });
    const now = new Date().toISOString();
    const row = {
      id: String(article?.id || crypto.randomUUID()),
      slug, title, description: String(article?.description || '').slice(0, 5000),
      category: String(article?.category || 'calculators').slice(0, 120),
      author: String(article?.author || 'Online Tools Editorial Team').slice(0, 120),
      published_date: String(article?.publishedDate || now.slice(0, 10)),
      updated_date: now.slice(0, 10),
      reading_time: String(article?.readingTime || '5 min read').slice(0, 40),
      quick_answer: String(article?.quickAnswer || '').slice(0, 5000) || null,
      formula: article?.formula || null, content_html: String(article?.contentHtml || ''),
      sections: Array.isArray(article?.sections) ? article.sections : [],
      practical_examples: Array.isArray(article?.practicalExamples) ? article.practicalExamples : [],
      common_mistakes: Array.isArray(article?.commonMistakes) ? article.commonMistakes : [],
      related_tools: Array.isArray(article?.relatedTools) ? article.relatedTools : [],
      related_guides: Array.isArray(article?.relatedGuides) ? article.relatedGuides : [],
      faq: Array.isArray(article?.faq) ? article.faq : [],
      target_keyword: String(article?.targetKeyword || '').slice(0, 200),
      seo_score: Math.max(0, Math.min(100, Number(article?.seoScore || 85))),
      is_draft: Boolean(article?.isDraft),
      updated_at: now,
    };
    const { error } = await db.from('guides').upsert(row, { onConflict: 'slug' });
    if (error) {
      console.error('[AdminGuidesAPI] Save failed:', error.message);
      return sendJson(res, 500, { success: false, error: 'Unable to save guide.' });
    }
    return sendJson(res, 200, { success: true });
  } catch (error: any) {
    console.error('[AdminGuidesAPI] Request failed:', error?.message || error);
    return sendJson(res, 400, { success: false, error: 'Invalid guide request.' });
  }
}
