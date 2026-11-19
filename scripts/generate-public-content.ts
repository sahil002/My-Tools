import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
const out = path.resolve(process.cwd(), 'src/generated/publicContent.ts');
const jsonOut = path.resolve(process.cwd(), 'src/generated/publicContent.json');

if (!url || !key) {
  throw new Error('[public-content] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required to prerender published Supabase content. Configure them in Vercel Production and Preview environments.');
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [cats, tools, guides] = await Promise.all([
  db.from('categories').select('id,slug,name,description,icon,icon_name,parent_category_id,is_visible,seo_title,seo_description,tool_count,faq,updated_at').eq('is_visible', true),
  db.from('tools').select('id,slug,name,description,category,icon,is_active,is_featured,tags,usage_count,created_at,updated_at,long_description,seo_title,seo_description,thumbnail_url,is_custom,zip_file_name,zip_file_size,files_count,entry_html_path,storage_path,storage_url').eq('is_active', true),
  db.from('guides').select('slug,title,description,category,author,published_date,updated_date,reading_time,quick_answer,formula,content_html,sections,practical_examples,common_mistakes,related_tools,related_guides,faq,target_keyword,seo_score,is_draft,created_at,updated_at').eq('is_draft', false),
]);

for (const [name, result] of [['categories', cats], ['tools', tools], ['guides', guides]] as const) {
  if (result.error) throw new Error(`[public-content] Failed to fetch published ${name}: ${result.error.message}`);
}

const safe = (value: unknown) => JSON.stringify(value ?? []).replace(/</g, '\\u003c');
const content = [
  '// Generated at build time from published Supabase records. Do not edit manually.',
  `export const PUBLIC_CATEGORIES = ${safe(cats.data)} as any[];`,
  `export const PUBLIC_TOOLS = ${safe(tools.data)} as any[];`,
  `export const PUBLIC_GUIDES = ${safe(guides.data)} as any[];`,
  ''
].join('\n');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, content, 'utf8');
fs.writeFileSync(jsonOut, JSON.stringify({ categories: cats.data, tools: tools.data, guides: guides.data }), 'utf8');
console.log(`[public-content] Generated ${cats.data.length} categories, ${tools.data.length} tools and ${guides.data.length} guides.`);
