-- Online Tools security hardening.
-- Apply this migration only after the server-side admin APIs in this branch are deployed.
-- Public visitors can read only published/public data and submit pending content; admin
-- mutations are performed by authenticated server APIs using the server-only service key.

-- Admin credentials and TOTP secrets must never be reachable with the public key.
alter table if exists public.admin_users enable row level security;
drop policy if exists "Service role full access to admin_users" on public.admin_users;
revoke all on table public.admin_users from public, anon, authenticated;
grant all on table public.admin_users to service_role;

alter table if exists public.admin_two_factor enable row level security;
revoke all on table public.admin_two_factor from public, anon, authenticated;
grant all on table public.admin_two_factor to service_role;

-- Guides: public readers see published rows only; all writes go through /api/admin/guides.
alter table public.guides enable row level security;
drop policy if exists "Allow anon all on guides" on public.guides;
drop policy if exists "Public can read published guides" on public.guides;
revoke all on table public.guides from public, anon, authenticated;
grant select on table public.guides to anon, authenticated;
grant all on table public.guides to service_role;
create policy "Public can read published guides" on public.guides
  for select to anon, authenticated using (coalesce(is_draft, false) = false);

-- Guide comments: only approved comments are public; new comments must await moderation.
alter table public.guide_comments enable row level security;
drop policy if exists "Allow anon all on guide_comments" on public.guide_comments;
drop policy if exists "Public can read approved guide comments" on public.guide_comments;
drop policy if exists "Public can submit pending guide comments" on public.guide_comments;
revoke all on table public.guide_comments from public, anon, authenticated;
grant select, insert on table public.guide_comments to anon, authenticated;
grant all on table public.guide_comments to service_role;
create policy "Public can read approved guide comments" on public.guide_comments
  for select to anon, authenticated using (status = 'approved');
create policy "Public can submit pending guide comments" on public.guide_comments
  for insert to anon, authenticated with check (
    status = 'pending'
    and length(trim(coalesce(author_name, ''))) between 1 and 100
    and length(trim(coalesce(content, ''))) between 1 and 3000
    and length(trim(coalesce(guide_slug, ''))) between 1 and 160
    and (rating is null or rating between 1 and 5)
  );

-- Site settings: expose only the explicitly public global settings row; writes are server-only.
alter table public.site_settings enable row level security;
drop policy if exists "Service role full access to site_settings" on public.site_settings;
drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Public can read global site settings" on public.site_settings;
revoke all on table public.site_settings from public, anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant all on table public.site_settings to service_role;
create policy "Public can read global site settings" on public.site_settings
  for select to anon, authenticated using (key = 'global_site_settings');

-- Subscriber email addresses are private. The public form may add rows only; reads,
-- status changes, deletes, and all broadcast operations remain server/admin-only.
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
create policy "Public can subscribe" on public.subscribers
  for insert to anon, authenticated with check (
    length(trim(email)) between 5 and 254
    and position('@' in email) > 1
    and status = 'active'
    and source in ('homepage_banner', 'tool_view', 'footer', 'blog_sidebar')
  );

-- Tool comments: public submission goes through the public-comments API and remains pending.
alter table public.tool_comments enable row level security;
drop policy if exists "Service role full access to tool_comments" on public.tool_comments;
drop policy if exists "Public can submit comments" on public.tool_comments;
drop policy if exists "Public can view approved comments" on public.tool_comments;
drop policy if exists "Public can submit pending comments" on public.tool_comments;
revoke all on table public.tool_comments from public, anon, authenticated;
grant select, insert on table public.tool_comments to anon, authenticated;
grant all on table public.tool_comments to service_role;
create policy "Public can view approved comments" on public.tool_comments
  for select to anon, authenticated using (status = 'approved');
create policy "Public can submit pending comments" on public.tool_comments
  for insert to anon, authenticated with check (
    status = 'pending'
    and length(trim(coalesce(author_name, ''))) between 1 and 100
    and length(trim(coalesce(comment, ''))) between 1 and 3000
    and length(trim(coalesce(tool_slug, ''))) between 1 and 120
    and (rating is null or rating between 1 and 5)
  );

-- Tool requests: visitors can submit pending requests; all reads/modifications are admin-only.
alter table public.tool_requests enable row level security;
drop policy if exists "Service role full access to tool_requests" on public.tool_requests;
drop policy if exists "Public can submit tool requests" on public.tool_requests;
drop policy if exists "Public can submit pending tool requests" on public.tool_requests;
revoke all on table public.tool_requests from public, anon, authenticated;
grant insert on table public.tool_requests to anon, authenticated;
grant all on table public.tool_requests to service_role;
create policy "Public can submit pending tool requests" on public.tool_requests
  for insert to anon, authenticated with check (
    status = 'pending'
    and length(trim(coalesce(tool_name, ''))) between 1 and 160
    and length(trim(coalesce(use_case, ''))) between 1 and 5000
    and (email is null or length(email) <= 254)
  );

-- Favorites: public can add/remove by visitor token under existing validation policies,
-- but cannot enumerate other visitors' records. Admin analytics use /api/admin/favorites.
alter table public.tool_favorites enable row level security;
revoke all on table public.tool_favorites from public, anon, authenticated;
grant insert, delete on table public.tool_favorites to anon, authenticated;
grant all on table public.tool_favorites to service_role;
drop policy if exists "Public can add tool favorites" on public.tool_favorites;
drop policy if exists "Public can remove own tool favorite" on public.tool_favorites;
create policy "Public can add tool favorites" on public.tool_favorites
  for insert to anon, authenticated with check (length(visitor_id) between 16 and 128);
create policy "Public can remove own tool favorite" on public.tool_favorites
  for delete to anon, authenticated using (length(visitor_id) between 16 and 128);

-- Public tool catalogue is read-only. Never grant public write, truncate, or trigger access.
alter table public.tools enable row level security;
revoke all on table public.tools from public, anon, authenticated;
grant select on table public.tools to anon, authenticated;
grant all on table public.tools to service_role;
drop policy if exists "Public can view active tools" on public.tools;
create policy "Public can view active tools" on public.tools
  for select to anon, authenticated using (is_active = true);

-- Categories are public metadata, but changes are allowed only through /api/admin/categories.
alter table public.categories enable row level security;
revoke all on table public.categories from public, anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant all on table public.categories to service_role;
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
  for select to anon, authenticated using (true);

-- Persistent admin rate-limit records and the RPC remain private to service_role.
alter table public.admin_rate_limits enable row level security;
revoke all on table public.admin_rate_limits from public, anon, authenticated;
grant all on table public.admin_rate_limits to service_role;
revoke all on function public.admin_rate_limit_action(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_rate_limit_action(text, text, integer, integer) to service_role;
