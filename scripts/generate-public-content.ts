import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const out = path.resolve(process.cwd(), 'src/generated/publicContent.ts');

if (!url || !key) {
  throw new Error('[public-content] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required to prerender published Supabase content. Configure them in Vercel Production and Preview environments.');
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [cats, tools, guides] = await Promise.all([
  db.from('categories').select('*').eq('is_visible', true),
  db.from('tools').select('*').eq('is_active', true),
  db.from('guides').select('*').eq('is_draft', false),
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
].join('\\n');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, content, 'utf8');
console.log(`[public-content] Generated ${cats.data.length} categories, ${tools.data.length} tools and ${guides.data.length} guides.`);
