-- Category visibility and icon selection metadata.
-- Existing categories stay visible by default; no category or tool data is deleted.
alter table public.categories
  add column if not exists is_visible boolean not null default true,
  add column if not exists icon_mode text not null default 'auto'
    check (icon_mode in ('auto', 'manual'));

create index if not exists idx_categories_is_visible_name
  on public.categories (is_visible, name);

-- Public reads are filtered by the API using is_visible = true.
-- Keep writes restricted to the existing server-side service-role API.

-- Keep hidden categories out of direct public table reads as well as the API.
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read visible categories"
  on public.categories for select to anon, authenticated
  using (is_visible = true);
