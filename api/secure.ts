import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { getAuthenticatedAdminFromRequest, parseJsonBody, sendJson } from './_lib/adminAuthServer.js';
import { getSupabaseServerClient } from './_lib/supabaseServer.js';

function routeFor(req: IncomingMessage): string {
  return new URL(req.url || '/', 'http://localhost').searchParams.get('route') || '';
}
function slugify(value: unknown, max = 160): string {
  return String(value || '').trim().toLowerCase().slice(0, max);
}
function validSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
function send(res: ServerResponse, status: number, payload: unknown, cache = 'no-store') {
  res.setHeader('Cache-Control', cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return sendJson(res, status, payload);
}
async function readRawBody(req: IncomingMessage, maxBytes: number): Promise<any> {
  let raw = '';
  for await (const chunk of req as any) {
    raw += chunk.toString();
    if (raw.length > maxBytes) throw Object.assign(new Error('Request too large.'), { statusCode: 413 });
  }
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON.'), { statusCode: 400 }); }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const route = routeFor(req);
  const url = new URL(req.url || '/', 'http://localhost');

  // Runtime sitemap: reads published records at request time, so new publishes appear without a redeploy.
  if (route === 'public-sitemap') {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
    const siteUrl = 'https://www.prbsolver.com';
    const routeMap = new Map<string, { loc: string; lastmod?: string; changefreq: string; priority: string }>();
    // Keep this serverless handler self-contained. Importing the frontend sitemap
    // module here pulls extensionless TypeScript imports into Node's native ESM runtime,
    // which causes FUNCTION_INVOCATION_FAILED in production.
    const staticRoutes: Array<{ path: string; changefreq: string; priority: string }> = [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/tools', priority: '0.9', changefreq: 'daily' },
      { path: '/categories', priority: '0.9', changefreq: 'weekly' },
      { path: '/guides', priority: '0.9', changefreq: 'weekly' },
      { path: '/request-a-tool', priority: '0.7', changefreq: 'monthly' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
      { path: '/contact', priority: '0.6', changefreq: 'monthly' },
      { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
      { path: '/terms', priority: '0.3', changefreq: 'yearly' },
      { path: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
      { path: '/sitemap', priority: '0.4', changefreq: 'monthly' },
    ];
    for (const item of staticRoutes) {
      const path = item.path;
      routeMap.set(path, { loc: `${siteUrl}${path === '/' ? '' : path}`, changefreq: item.changefreq, priority: item.priority });
    }
    const db = getSupabaseServerClient(true);
    if (db) {
      const [categories, tools, guides] = await Promise.all([
        db.from('categories').select('slug, updated_at').eq('is_visible', true).limit(2000),
        db.from('tools').select('slug, category, updated_at').eq('is_active', true).limit(2000),
        db.from('guides').select('slug, updated_date, updated_at').eq('is_draft', false).limit(2000),
      ]);
      const sitemapSegment = (value: unknown): string | undefined => {
        const segment = String(value ?? '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment) ? segment : undefined;
      };
      const sitemapDate = (value: unknown): string | undefined => {
        if (typeof value !== 'string' || !value.trim()) return undefined;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
      };

      for (const row of categories.data || []) {
        const slug = sitemapSegment(row.slug);
        if (!slug || slug === 'admin' || slug === 'api') continue;
        const path = `/${slug}`;
        routeMap.set(path, { loc: `${siteUrl}${path}`, lastmod: sitemapDate(row.updated_at), changefreq: 'weekly', priority: '0.8' });
      }
      for (const row of tools.data || []) {
        const category = sitemapSegment(row.category);
        const slug = sitemapSegment(row.slug);
        if (!category || !slug) continue;
        const path = `/${category}/${slug}`;
        routeMap.set(path, { loc: `${siteUrl}${path}`, lastmod: sitemapDate(row.updated_at), changefreq: 'monthly', priority: '0.8' });
      }
      for (const row of guides.data || []) {
        const slug = sitemapSegment(row.slug);
        // This legacy slug permanently redirects to the current canonical guide.
        if (!slug || slug === 'compound-interest-calculator-best-7-steps-to-grow-your-money-in-2026') continue;
        const path = `/guides/${slug}`;
        routeMap.set(path, { loc: `${siteUrl}${path}`, lastmod: sitemapDate(row.updated_date || row.updated_at), changefreq: 'monthly', priority: '0.7' });
      }
      if (categories.error || tools.error || guides.error) {
        console.error('[sitemap] One or more published database route queries failed.');
      }
    }
    const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const entries = [...routeMap.values()].map((item) => {
      const lastmod = item.lastmod ? `\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(item.loc)}</loc>${lastmod}\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`;
    }).join('\n');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.statusCode = 200;
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
    return;
  }

  // Public, read-only category metadata.
  if (route === 'public-categories') {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
    const db = getSupabaseServerClient(false);
    if (!db) return send(res, 503, { success: false, error: 'Categories unavailable.' }, 'public, max-age=30, s-maxage=30');
    const { data, error } = await db.from('categories')
      .select('id, slug, name, description, icon, icon_mode, seo_title, seo_description, tool_count, faq, created_at, is_visible, parent_category_id')
      .eq('is_visible', true)
      .order('name', { ascending: true });
    if (error) return send(res, 503, { success: false, error: 'Categories unavailable.' }, 'public, max-age=30, s-maxage=30');
    return send(res, 200, { success: true, categories: data || [] }, 'public, max-age=30, s-maxage=30');
  }

  // Public custom-tool metadata endpoint.
  if (route === 'public-tools') {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
    const requestedSlug = url.searchParams.get('slug');
    const db = getSupabaseServerClient(true);
    if (!db) return send(res, 503, { success: false, error: 'Tools unavailable.' }, 'public, max-age=30, s-maxage=30');

    if (!requestedSlug) {
      // Listing endpoint exposes only safe metadata; storage paths and ZIP details
      // are returned only for a specific active custom tool when its page is opened.
      const { data, error } = await db.from('tools')
        .select('id, slug, name, description, category, icon, is_active, is_featured, tags, usage_count, favorite_count, created_at, updated_at, long_description, seo_title, seo_description, thumbnail_url, is_custom')
        .eq('is_custom', true).eq('is_active', true).order('name', { ascending: true }).limit(500);
      if (error) return send(res, 503, { success: false, error: 'Tools unavailable.' }, 'public, max-age=30, s-maxage=30');
      return send(res, 200, { success: true, tools: data || [] }, 'public, max-age=30, s-maxage=30');
    }

    const slug = slugify(requestedSlug, 120);
    if (!validSlug(slug)) return send(res, 400, { success: false, error: 'A valid tool slug is required.' });
    const { data, error } = await db.from('tools')
      .select('id, slug, name, description, category, icon, is_active, is_featured, tags, usage_count, favorite_count, created_at, updated_at, long_description, seo_title, seo_description, thumbnail_url, entry_html_path, storage_path, files_count, zip_file_name, zip_file_size, is_custom')
      .eq('slug', slug).eq('is_custom', true).eq('is_active', true).maybeSingle();
    if (error) return send(res, 503, { success: false, error: 'Tools unavailable.' }, 'public, max-age=30, s-maxage=30');
    if (!data) return send(res, 404, { success: false, error: 'Tool not found.' }, 'public, max-age=30, s-maxage=30');
    const storageUrl = data.storage_path
      ? db.storage.from('custom-tools').getPublicUrl(data.storage_path).data.publicUrl
      : null;
    return send(res, 200, { success: true, tool: { ...data, storage_url: storageUrl } }, 'public, max-age=30, s-maxage=30');
  }

  // Public comments: reads only approved entries; new submissions are pending moderation.
  if (route === 'public-comments') {
    if (req.method === 'GET') {
      const db = getSupabaseServerClient(false);
      if (!db) return send(res, 503, { success: false, error: 'Comments unavailable.' }, 'public, max-age=30, s-maxage=30');
      const slug = String(url.searchParams.get('tool_slug') || '').slice(0, 120);
      let query = db.from('tool_comments').select('id, tool_slug, author_name, comment, rating, status, created_at')
        .eq('status', 'approved').order('created_at', { ascending: false }).limit(100);
      if (slug) query = query.eq('tool_slug', slug);
      const { data, error } = await query;
      if (error) return send(res, 503, { success: false, error: 'Comments unavailable.' });
      return send(res, 200, { success: true, items: data || [] }, 'no-store');
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
    let body: any;
    try { body = await readRawBody(req, 12000); } catch (e: any) { return send(res, e.statusCode || 400, { success: false, error: e.message }); }
    const tool_slug = slugify(body.tool_slug, 120);
    const author_name = String(body.author_name || '').trim().slice(0, 100);
    const author_email = String(body.author_email || '').trim().slice(0, 254);
    const comment = String(body.comment || '').trim().slice(0, 3000);
    const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
    if (!validSlug(tool_slug) || !author_name || !comment || !Number.isFinite(rating)) return send(res, 400, { success: false, error: 'Valid tool, name and comment are required.' });
    // Public submission is insert-only, but it must not depend on anon-key INSERT
    // policies that may intentionally be disabled. Use the server-only key here;
    // this route exposes no read/update/delete operations and always forces pending.
    const db = getSupabaseServerClient(true);
    if (!db) return send(res, 503, { success: false, error: 'Comment service is not configured. Please try again later.' });

    if (author_email.length > 254 || comment.length < 5) {
      return send(res, 400, { success: false, error: 'Please provide a valid name and a comment of at least 5 characters.' });
    }

    // Server-side duplicate guard: repeated taps/retries with the same content
    // within 2 minutes reuse the original pending record instead of inserting twice.
    const duplicateSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    try {
      const { data: duplicate, error: duplicateError } = await db.from('tool_comments')
        .select('id')
        .eq('tool_slug', tool_slug)
        .eq('author_name', author_name)
        .eq('comment', comment)
        .gte('created_at', duplicateSince)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!duplicateError && duplicate?.id) {
        return send(res, 200, { success: true, id: duplicate.id, message: 'Comment already received and is awaiting review.' });
      }
    } catch {
      // Duplicate lookup is best-effort; insertion still uses a pending status.
    }

    const { data: insertedComment, error } = await db.from('tool_comments')
      .insert({ tool_slug, author_name, author_email: author_email || null, comment, rating, status: 'pending' })
      .select('id')
      .single();
    if (error || !insertedComment?.id) {
      console.error('[public-comments] Submission failed', {
        code: error?.code || 'unknown',
        message: error?.message || 'No inserted comment ID returned',
      });
      return send(res, 503, { success: false, error: 'Comment could not be saved. Please try again later.' });
    }
    return send(res, 200, { success: true, id: insertedComment.id, message: 'Comment submitted for review.' });
  }

  // Public newsletter endpoint: insert-only, no public enumeration/update of email records.
  if (route === 'public-subscribe') {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
    let body: any;
    try { body = await readRawBody(req, 4000); } catch (e: any) { return send(res, e.statusCode || 400, { success: false, error: e.message }); }
    const email = String(body?.email || '').trim().toLowerCase();
    const source = String(body?.source || 'homepage_banner');
    const sources = new Set(['homepage_banner', 'tool_view', 'footer', 'blog_sidebar']);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !sources.has(source)) return send(res, 400, { success: false, error: 'A valid email and subscription source are required.' });
    const db = getSupabaseServerClient(false);
    if (!db) return send(res, 503, { success: false, error: 'Subscription service is unavailable.' });
    const { error } = await db.from('subscribers').insert({ email, status: 'active', source });
    if (error?.code === '23505') return send(res, 200, { success: true, isNew: false, message: 'This email is already subscribed.' });
    if (error) return send(res, 503, { success: false, error: 'Unable to subscribe right now.' });
    return send(res, 200, { success: true, isNew: true, message: 'Subscription saved.' });
  }

  // Authenticated website-health audit metadata. No write operations are exposed.
  if (route === 'admin-site-health') {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
    if (!getAuthenticatedAdminFromRequest(req)) return send(res, 401, { success: false, error: 'Authentication required.' });
    const db = getSupabaseServerClient(true);
    if (!db) return send(res, 503, { success: false, error: 'Secure database configuration is missing.' });
    const siteUrl = 'https://www.prbsolver.com';
    const [categories, tools, guides] = await Promise.all([
      db.from('categories').select('slug, name, description, seo_title, seo_description, is_visible').eq('is_visible', true).limit(2000),
      db.from('tools').select('slug, name, description, category, seo_title, seo_description, is_active').eq('is_active', true).limit(2000),
      db.from('guides').select('slug, title, description, target_keyword, is_draft').eq('is_draft', false).limit(2000),
    ]);
    if (categories.error || tools.error || guides.error) {
      return send(res, 503, { success: false, error: 'Unable to read all published records. Check the tools, categories and guides database tables.' });
    }
    const routeMap = new Map<string, { path: string; url: string; type: string; title: string; seoTitle: string; seoDescription: string }>();
    for (const item of getAllSitemapRoutes(siteUrl)) {
      const path = item.path.startsWith('/') ? item.path : `/${item.path}`;
      routeMap.set(path, { path, url: `${siteUrl}${path === '/' ? '' : path}`, type: path === '/' ? 'home' : path.startsWith('/guides/') ? 'guide' : path.split('/').length > 2 ? 'tool' : 'page', title: path, seoTitle: '', seoDescription: '' });
    }
    for (const row of categories.data || []) if (row.slug) {
      const path = `/${String(row.slug).replace(/^\/+|\/+$/g, '')}`;
      routeMap.set(path, { path, url: `${siteUrl}${path}`, type: 'category', title: String(row.name || row.slug), seoTitle: String(row.seo_title || ''), seoDescription: String(row.seo_description || row.description || '') });
    }
    for (const row of tools.data || []) if (row.slug && row.category) {
      const path = `/${String(row.category).replace(/^\/+|\/+$/g, '')}/${String(row.slug).replace(/^\/+|\/+$/g, '')}`;
      routeMap.set(path, { path, url: `${siteUrl}${path}`, type: 'tool', title: String(row.name || row.slug), seoTitle: String(row.seo_title || ''), seoDescription: String(row.seo_description || row.description || '') });
    }
    for (const row of guides.data || []) if (row.slug) {
      const path = `/guides/${String(row.slug).replace(/^\/+|\/+$/g, '')}`;
      routeMap.set(path, { path, url: `${siteUrl}${path}`, type: 'guide', title: String(row.title || row.slug), seoTitle: String(row.title || ''), seoDescription: String(row.description || '') });
    }
    const seoIssues = [...routeMap.values()].filter((item) => {
      if (item.type === 'home' || item.type === 'page' || item.title === item.path) return false;
      return !item.title.trim() || !item.seoTitle.trim() || !item.seoDescription.trim();
    }).map((item) => ({
      path: item.path, url: item.url, type: item.type, title: item.title,
      missing: [!item.title.trim() ? 'page title' : '', !item.seoTitle.trim() ? 'explicit SEO title (fallback title may still display)' : '', !item.seoDescription.trim() ? 'meta description' : ''].filter(Boolean),
    }));
    return send(res, 200, {
      success: true, checkedAt: new Date().toISOString(),
      expectedRoutes: [...routeMap.values()],
      seoIssues,
      sourceCounts: { categories: categories.data?.length || 0, activeTools: tools.data?.length || 0, publishedGuides: guides.data?.length || 0 },
    });
  }

  // Everything below is administrator-only and uses the server-only Supabase key.
  const adminRoutes = new Set(['admin-categories', 'admin-guides', 'admin-settings', 'admin-moderation', 'admin-tools-db']);
  if (!adminRoutes.has(route)) return send(res, 404, { success: false, error: 'Unknown API route.' });
  if (!getAuthenticatedAdminFromRequest(req)) return send(res, 401, { success: false, error: 'Authentication required.' });
  const db = getSupabaseServerClient(true);
  if (!db) return send(res, 503, { success: false, error: 'Secure database configuration is missing.' });

  try {
    if (route === 'admin-categories') {
      if (req.method === 'GET') {
        const { data, error } = await db.from('categories')
          .select('id, slug, name, description, icon, icon_mode, seo_title, seo_description, tool_count, faq, created_at, is_visible, parent_category_id')
          .order('name', { ascending: true });
        if (error) return send(res, 500, { success: false, error: 'Unable to load categories.' });
        return send(res, 200, { success: true, categories: data || [] });
      }
      if (req.method === 'DELETE') {
        const body = await parseJsonBody<{ slug?: string }>(req);
        const slug = slugify(body?.slug, 120);
        if (!validSlug(slug)) return send(res, 400, { success: false, error: 'Invalid category slug.' });
        const { error } = await db.from('categories').delete().eq('slug', slug);
        if (error) return send(res, 500, { success: false, error: 'Unable to delete category.' });
        return send(res, 200, { success: true });
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST, DELETE'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
      const body = await parseJsonBody<{ slug?: string; name?: string; description?: string; icon?: string; iconName?: string; iconMode?: 'auto' | 'manual'; isVisible?: boolean; seoTitle?: string; seoDescription?: string; toolCount?: number; faq?: unknown[]; parentCategoryId?: string | null }>(req);
      const slug = slugify(body?.slug, 120);
      const name = String(body?.name || '').trim();
      if (!validSlug(slug) || !name || name.length > 120) return send(res, 400, { success: false, error: 'Valid category name and slug are required.' });
      const parentCategoryId = String(body?.parentCategoryId || '').trim() || null;
      const { data: existingCategory, error: existingCategoryError } = await db.from('categories').select('id').eq('slug', slug).maybeSingle();
      if (existingCategoryError) return send(res, 500, { success: false, error: 'Unable to validate category hierarchy.' });
      if (parentCategoryId) {
        if (!/^[0-9a-f-]{36}$/i.test(parentCategoryId)) return send(res, 400, { success: false, error: 'Invalid parent category.' });
        if (existingCategory?.id === parentCategoryId) return send(res, 400, { success: false, error: 'A category cannot be its own parent.' });
        const { data: parent, error: parentError } = await db.from('categories').select('id, parent_category_id').eq('id', parentCategoryId).maybeSingle();
        if (parentError || !parent || parent.parent_category_id) return send(res, 400, { success: false, error: 'Choose an existing main category as the parent.' });
        if (existingCategory?.id) {
          const { data: children, error: childrenError } = await db.from('categories').select('id').eq('parent_category_id', existingCategory.id).limit(1);
          if (childrenError) return send(res, 500, { success: false, error: 'Unable to validate category hierarchy.' });
          if (children?.length) return send(res, 400, { success: false, error: 'A main category with subcategories cannot be nested under another category.' });
        }
      }
      const row = { parent_category_id: parentCategoryId, slug, name, description: String(body?.description || '').slice(0, 2000), icon: String(body?.icon || body?.iconName || 'Grid2X2').slice(0, 80), icon_mode: body?.iconMode === 'manual' ? 'manual' : 'auto', is_visible: body?.isVisible !== false, seo_title: String(body?.seoTitle || '').slice(0, 180) || null, seo_description: String(body?.seoDescription || '').slice(0, 320) || null, tool_count: Math.max(0, Math.min(1000000, Number(body?.toolCount || 0))), faq: Array.isArray(body?.faq) ? body.faq : null, updated_at: new Date().toISOString() };
      const { error } = await db.from('categories').upsert(row, { onConflict: 'slug' });
      if (error) return send(res, 500, { success: false, error: 'Unable to save category.' });
      return send(res, 200, { success: true, category: row });
    }

    if (route === 'admin-guides') {
      if (req.method === 'GET') {
        const { data, error } = await db.from('guides').select('*').order('created_at', { ascending: false });
        if (error) return send(res, 500, { success: false, error: 'Unable to load guides.' });
        return send(res, 200, { success: true, items: data || [] });
      }
      if (req.method === 'DELETE') {
        const body = await parseJsonBody<{ slug?: string }>(req);
        const slug = slugify(body?.slug);
        if (!validSlug(slug)) return send(res, 400, { success: false, error: 'Invalid guide slug.' });
        const { error } = await db.from('guides').delete().eq('slug', slug);
        if (error) return send(res, 500, { success: false, error: 'Unable to delete guide.' });
        return send(res, 200, { success: true });
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST, DELETE'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
      const body = await parseJsonBody<{ article?: Record<string, any> }>(req);
      const article = body?.article;
      const slug = slugify(article?.slug);
      const title = String(article?.title || '').trim();
      if (!validSlug(slug) || !title || title.length > 240) return send(res, 400, { success: false, error: 'Valid guide title and slug are required.' });
      const now = new Date().toISOString();
      const row = { id: String(article?.id || crypto.randomUUID()), slug, title, description: String(article?.description || '').slice(0, 5000), category: String(article?.category || 'calculators').slice(0, 120), author: String(article?.author || 'Online Tools Editorial Team').slice(0, 120), published_date: String(article?.publishedDate || now.slice(0, 10)), updated_date: now.slice(0, 10), reading_time: String(article?.readingTime || '5 min read').slice(0, 40), quick_answer: String(article?.quickAnswer || '').slice(0, 5000) || null, formula: article?.formula || null, content_html: String(article?.contentHtml || ''), sections: Array.isArray(article?.sections) ? article.sections : [], practical_examples: Array.isArray(article?.practicalExamples) ? article.practicalExamples : [], common_mistakes: Array.isArray(article?.commonMistakes) ? article.commonMistakes : [], related_tools: Array.isArray(article?.relatedTools) ? article.relatedTools : [], related_guides: Array.isArray(article?.relatedGuides) ? article.relatedGuides : [], faq: Array.isArray(article?.faq) ? article.faq : [], target_keyword: String(article?.targetKeyword || '').slice(0, 200), seo_score: Math.max(0, Math.min(100, Number(article?.seoScore || 85))), is_draft: Boolean(article?.isDraft), updated_at: now };
      const { error } = await db.from('guides').upsert(row, { onConflict: 'slug' });
      if (error) return send(res, 500, { success: false, error: 'Unable to save guide.' });
      return send(res, 200, { success: true });
    }

    if (route === 'admin-tools-db') {
      if (req.method === 'GET') {
        const { data, error } = await db.from('tools').select('*').order('name', { ascending: true });
        if (error) return send(res, 500, { success: false, error: 'Unable to load tool catalogue.' });
        return send(res, 200, { success: true, items: data || [] });
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
      const body = await parseJsonBody<{ action?: string; slug?: string; rows?: any[]; updates?: Record<string, unknown> }>(req);
      if (body?.action === 'seed') {
        if (!Array.isArray(body.rows) || body.rows.length > 500) return send(res, 400, { success: false, error: 'A valid tool list is required.' });
        const rows = body.rows.map((item) => ({
          slug: slugify(item?.slug, 120),
          name: String(item?.name || '').trim().slice(0, 160),
          description: String(item?.description || '').slice(0, 2000),
          category: String(item?.category || 'calculators').slice(0, 120),
          icon: String(item?.icon || 'Wrench').slice(0, 80),
          is_active: item?.is_active !== false,
          is_featured: Boolean(item?.is_featured),
          usage_count: Math.max(0, Number(item?.usage_count || 0)),
          favorite_count: Math.max(0, Number(item?.favorite_count || 0)),
          tags: Array.isArray(item?.tags) ? item.tags.map((tag: unknown) => String(tag).slice(0, 80)).slice(0, 50) : [],
          updated_at: new Date().toISOString(),
        }));
        if (rows.some((row) => !validSlug(row.slug) || !row.name)) return send(res, 400, { success: false, error: 'Each tool needs a valid slug and name.' });
        const { data, error } = await db.from('tools').upsert(rows, { onConflict: 'slug' }).select('slug');
        if (error) return send(res, 500, { success: false, error: 'Unable to sync tool catalogue.' });
        return send(res, 200, { success: true, count: data?.length || rows.length });
      }
      if (body?.action === 'update') {
        const slug = slugify(body.slug, 120);
        if (!validSlug(slug) || !body.updates || typeof body.updates !== 'object' || Array.isArray(body.updates)) return send(res, 400, { success: false, error: 'Valid tool slug and updates are required.' });
        const allowed = new Set(['name', 'description', 'category', 'icon', 'is_active', 'is_featured', 'tags', 'long_description', 'seo_title', 'seo_description', 'thumbnail_url']);
        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body.updates)) {
          if (allowed.has(key)) updates[key] = value;
        }
        if (!Object.keys(updates).length) return send(res, 400, { success: false, error: 'No supported tool fields were provided.' });
        updates.updated_at = new Date().toISOString();
        const { error } = await db.from('tools').update(updates).eq('slug', slug);
        if (error) return send(res, 500, { success: false, error: 'Unable to update tool.' });
        return send(res, 200, { success: true });
      }
      return send(res, 400, { success: false, error: 'Unknown tool database action.' });
    }

    if (route === 'admin-settings') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { success: false, error: 'Method not allowed.' }); }
      const body = await parseJsonBody<{ settings?: unknown }>(req);
      if (!body || typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings)) return send(res, 400, { success: false, error: 'Valid settings object is required.' });
      const { error } = await db.from('site_settings').upsert({ key: 'global_site_settings', value: body.settings, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) return send(res, 500, { success: false, error: 'Unable to save site settings.' });
      return send(res, 200, { success: true });
    }

    if (route === 'admin-moderation') {
      if (req.method === 'GET') {
        const type = url.searchParams.get('type');
        if (type === 'requests') {
          const { data, error } = await db.from('tool_requests').select('*').order('created_at', { ascending: false });
          if (error) return send(res, 500, { success: false, error: 'Unable to load requests.' });
          return send(res, 200, { success: true, items: data || [] });
        }
        if (type === 'comments') {
          const { data, error } = await db.from('tool_comments').select('*').order('created_at', { ascending: false });
          if (error) return send(res, 500, { success: false, error: 'Unable to load comments.' });
          return send(res, 200, { success: true, items: data || [] });
        }
        return send(res, 400, { success: false, error: 'Unknown moderation type.' });
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody<{ action?: string; id?: string; status?: string; notes?: string }>(req);
        if (!body?.id || !body.action) return send(res, 400, { success: false, error: 'Action and record ID are required.' });
        if (body.action === 'update-request') {
          const allowed = ['pending', 'in-review', 'planned', 'completed', 'declined'];
          if (!allowed.includes(String(body.status))) return send(res, 400, { success: false, error: 'Invalid request status.' });
          const { error } = await db.from('tool_requests').update({ status: body.status, admin_notes: String(body.notes || '').slice(0, 5000) }).eq('id', body.id);
          if (error) return send(res, 500, { success: false, error: 'Unable to update request.' });
          return send(res, 200, { success: true });
        }
        if (body.action === 'update-comment') {
          if (!['pending', 'approved', 'rejected'].includes(String(body.status))) return send(res, 400, { success: false, error: 'Invalid comment status.' });
          const { error } = await db.from('tool_comments').update({ status: body.status }).eq('id', body.id);
          if (error) return send(res, 500, { success: false, error: 'Unable to update comment.' });
          return send(res, 200, { success: true });
        }
        return send(res, 400, { success: false, error: 'Unknown moderation action.' });
      }
      if (req.method === 'DELETE') {
        const body = await parseJsonBody<{ kind?: string; id?: string }>(req);
        if (!body?.id || !['requests', 'comments'].includes(String(body.kind))) return send(res, 400, { success: false, error: 'Record type and ID are required.' });
        const table = body.kind === 'requests' ? 'tool_requests' : 'tool_comments';
        const { error } = await db.from(table).delete().eq('id', body.id);
        if (error) return send(res, 500, { success: false, error: 'Unable to delete record.' });
        return send(res, 200, { success: true });
      }
      res.setHeader('Allow', 'GET, POST, DELETE');
      return send(res, 405, { success: false, error: 'Method not allowed.' });
    }
  } catch (error: any) {
    console.error('[api/secure] Request failed:', error?.message || error);
    return send(res, error?.statusCode || 400, { success: false, error: error?.statusCode === 413 ? 'Request too large.' : 'Invalid request.' });
  }
}
