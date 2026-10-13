-- Apply after deploying server-side admin API routes from fix/security-audit-findings.
-- This removes public data access and write paths that previously allowed anonymous
-- visitors to read subscriber emails, edit published content, or bypass admin checks.

alter table public.admin_users enable row level security;
drop policy if exists "Service role full access to admin_users" on public.admin_users;
revoke all on table public.admin_users from public, anon, authenticated;
grant all on table public.admin_users to service_role;
alter table public.admin_two_factor enable row level security;
revoke all on table public.admin_two_factor from public, anon, authenticated;
grant all on table public.admin_two_factor to service_role;

alter table public.guides enable row level security;
drop policy if exists "Allow anon all on guides" on public.guides;
drop policy if exists "Public can read published guides" on public.guides;
revoke all on table public.guides from public, anon, authenticated;
grant select on table public.guides to anon, authenticated;
grant all on table public.guides to service_role;
create policy "Public can read published guides" on public.guides for select to anon, authenticated using (coalesce(is_draft, false) = false);

alter table public.guide_comments enable row level security;
drop policy if exists "Allow anon all on guide_comments" on public.guide_comments;
drop policy if exists "Public can read approved guide comments" on public.guide_comments;
drop policy if exists "Public can submit pending guide comments" on public.guide_comments;
revoke all on table public.guide_comments from public, anon, authenticated;
grant insert on table public.guide_comments to anon, authenticated;
grant select (id, guide_slug, author_name, rating, content, status, likes, created_at) on table public.guide_comments to anon, authenticated;
grant all on table public.guide_comments to service_role;
create policy "Public can read approved guide comments" on public.guide_comments for select to anon, authenticated using (status = 'approved');
create policy "Public can submit pending guide comments" on public.guide_comments for insert to anon, authenticated with check (
  status = 'pending' and length(trim(coalesce(author_name, ''))) between 1 and 100
  and length(trim(coalesce(content, ''))) between 1 and 3000
  and length(trim(coalesce(guide_slug, ''))) between 1 and 160
  and (rating is null or rating between 1 and 5)
);

alter table public.site_settings enable row level security;
drop policy if exists "Service role full access to site_settings" on public.site_settings;
drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Public can read global site settings" on public.site_settings;
revoke all on table public.site_settings from public, anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant all on table public.site_settings to service_role;
create policy "Public can read global site settings" on public.site_settings for select to anon, authenticated using (key = 'global_site_settings');

alter table public.subscribers enable row level security;
drop policy if exists "Public can read subscribers" on public.subscribers;
drop policy if exists "Public can subscribe" on public.subscribers;
drop policy if exists "Public can update subscriber status" on public.subscribers;
drop policy if exists "Public can check own subscription" on public.subscribers;
drop policy if exists "Public can update own subscription" on public.subscribers;
drop policy if exists "Service role full access to subscribers" on public.subscribers;
revoke all on table public.subscribers from public, anon, authenticated;
grant insert on table public.subscribers to anon, authenticated;
grant all on table public.subscribers to service_role;
create policy "Public can subscribe" on public.subscribers for insert to anon, authenticated with check (
  length(trim(email)) between 5 and 254 and position('@' in email) > 1
  and status = 'active' and source in ('homepage_banner', 'tool_view', 'footer', 'blog_sidebar')
);

alter table public.tool_comments enable row level security;
drop policy if exists "Service role full access to tool_comments" on public.tool_comments;
drop policy if exists "Public can submit comments" on public.tool_comments;
drop policy if exists "Public can view approved comments" on public.tool_comments;
drop policy if exists "Public can submit pending comments" on public.tool_comments;
revoke all on table public.tool_comments from public, anon, authenticated;
grant insert on table public.tool_comments to anon, authenticated;
grant select (id, tool_slug, author_name, comment, rating, status, created_at) on table public.tool_comments to anon, authenticated;
grant all on table public.tool_comments to service_role;
create policy "Public can view approved comments" on public.tool_comments for select to anon, authenticated using (status = 'approved');
create policy "Public can submit pending comments" on public.tool_comments for insert to anon, authenticated with check (
  status = 'pending' and length(trim(coalesce(author_name, ''))) between 1 and 100
  and length(trim(coalesce(comment, ''))) between 1 and 3000
  and length(trim(coalesce(tool_slug, ''))) between 1 and 120
  and (rating is null or rating between 1 and 5)
);

alter table public.tool_requests enable row level security;
drop policy if exists "Service role full access to tool_requests" on public.tool_requests;
drop policy if exists "Public can submit tool requests" on public.tool_requests;
drop policy if exists "Public can submit pending tool requests" on public.tool_requests;
revoke all on table public.tool_requests from public, anon, authenticated;
grant insert on table public.tool_requests to anon, authenticated;
grant all on table public.tool_requests to service_role;
create policy "Public can submit pending tool requests" on public.tool_requests for insert to anon, authenticated with check (
  status = 'pending' and length(trim(coalesce(tool_name, ''))) between 1 and 160
  and length(trim(coalesce(use_case, ''))) between 1 and 5000
  and (email is null or length(email) <= 254)
);

alter table public.tool_favorites enable row level security;
revoke all on table public.tool_favorites from public, anon, authenticated;
grant insert on table public.tool_favorites to anon, authenticated;
grant all on table public.tool_favorites to service_role;
drop policy if exists "Public can add tool favorites" on public.tool_favorites;
drop policy if exists "Public can remove own tool favorite" on public.tool_favorites;
create policy "Public can add tool favorites" on public.tool_favorites for insert to anon, authenticated with check (length(visitor_id) between 16 and 128);

alter table public.tools enable row level security;
revoke all on table public.tools from public, anon, authenticated;
grant select (id, slug, name, description, category, icon, is_active, is_featured, tags, usage_count, favorite_count, created_at, updated_at, long_description, seo_title, seo_description, thumbnail_url, is_custom) on table public.tools to anon, authenticated;
grant all on table public.tools to service_role;
drop policy if exists "Public can view active tools" on public.tools;
create policy "Public can view active tools" on public.tools for select to anon, authenticated using (is_active = true);

-- categories already exists from the foundation migration. Public access is read-only.
alter table public.categories enable row level security;
revoke all on table public.categories from public, anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant all on table public.categories to service_role;
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);
