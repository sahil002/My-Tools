-- Additive prerequisites for security fixes. Safe to apply before the app code is deployed.
create table if not exists public.admin_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.admin_rate_limits enable row level security;
revoke all on table public.admin_rate_limits from public, anon, authenticated;
grant all on table public.admin_rate_limits to service_role;

create or replace function public.admin_rate_limit_action(
  p_key_hash text, p_action text, p_max_attempts integer, p_window_seconds integer
)
returns table(is_locked boolean, seconds_left integer, remaining_attempts integer)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row public.admin_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_key_hash !~ '^[a-f0-9]{64}$'
     or p_action not in ('check', 'fail', 'reset')
     or p_max_attempts < 1 or p_max_attempts > 100
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit arguments';
  end if;
  if p_action = 'reset' then
    delete from public.admin_rate_limits where key_hash = p_key_hash;
    return query select false, 0, p_max_attempts;
    return;
  end if;
  insert into public.admin_rate_limits(key_hash, attempts, window_started_at, locked_until, updated_at)
    values (p_key_hash, 0, v_now, null, v_now) on conflict (key_hash) do nothing;
  select * into v_row from public.admin_rate_limits where key_hash = p_key_hash for update;
  if v_row.locked_until is not null and v_row.locked_until > v_now then
    return query select true, greatest(1, ceil(extract(epoch from (v_row.locked_until - v_now)))::integer), 0;
    return;
  end if;
  if v_row.window_started_at + make_interval(secs => p_window_seconds) <= v_now
     or (v_row.locked_until is not null and v_row.locked_until <= v_now) then
    update public.admin_rate_limits set attempts = 0, window_started_at = v_now, locked_until = null, updated_at = v_now where key_hash = p_key_hash;
    v_row.attempts := 0; v_row.window_started_at := v_now; v_row.locked_until := null;
  end if;
  if p_action = 'fail' then
    v_row.attempts := v_row.attempts + 1;
    if v_row.attempts >= p_max_attempts then v_row.locked_until := v_now + make_interval(secs => p_window_seconds); end if;
    update public.admin_rate_limits set attempts = v_row.attempts, locked_until = v_row.locked_until, updated_at = v_now where key_hash = p_key_hash;
  end if;
  return query select
    (v_row.locked_until is not null and v_row.locked_until > v_now),
    case when v_row.locked_until is not null and v_row.locked_until > v_now then greatest(1, ceil(extract(epoch from (v_row.locked_until - v_now)))::integer) else 0 end,
    case when v_row.locked_until is not null and v_row.locked_until > v_now then 0 else greatest(0, p_max_attempts - v_row.attempts) end;
end;
$$;
revoke all on function public.admin_rate_limit_action(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_rate_limit_action(text, text, integer, integer) to service_role;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  name text not null check (length(trim(name)) between 1 and 120),
  description text not null default '',
  icon text not null default 'Wrench',
  seo_title text,
  seo_description text,
  tool_count integer not null default 0 check (tool_count >= 0),
  faq jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;
revoke all on table public.categories from public, anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant all on table public.categories to service_role;
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);
