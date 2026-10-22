-- Math Problem Solver admin controls and privacy-preserving usage telemetry.
-- Provider keys are AES-256-GCM encrypted in application code before entering this JSONB column.
-- The encryption key itself must only exist in the Preview server environment.
create table if not exists public.math_ai_config (
  id integer primary key default 1 check (id = 1),
  ai_enabled boolean not null default false,
  image_upload_enabled boolean not null default false,
  primary_provider text not null default 'gemini' check (primary_provider in ('gemini','openrouter','groq')),
  fallback_enabled boolean not null default true,
  provider_credentials jsonb not null default '{}'::jsonb,
  monthly_budget_usd numeric(10,2) not null default 0 check (monthly_budget_usd >= 0),
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.math_ai_config enable row level security;
revoke all on table public.math_ai_config from public, anon, authenticated;
grant all on table public.math_ai_config to service_role;
insert into public.math_ai_config (id, ai_enabled, image_upload_enabled, primary_provider, fallback_enabled, provider_credentials)
values (1, false, false, 'gemini', true, '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.math_ai_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  provider text not null check (provider in ('local','gemini','openrouter','groq','none')),
  model text,
  outcome text not null check (outcome in ('success','error','disabled','quota_limited')),
  image_used boolean not null default false,
  latency_ms integer,
  input_chars integer not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  error_code text
);
create index if not exists math_ai_usage_created_at_idx on public.math_ai_usage (created_at desc);
create index if not exists math_ai_usage_provider_created_idx on public.math_ai_usage (provider, created_at desc);
alter table public.math_ai_usage enable row level security;
revoke all on table public.math_ai_usage from public, anon, authenticated;
grant all on table public.math_ai_usage to service_role;
