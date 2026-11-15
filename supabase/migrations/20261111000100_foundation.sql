-- ScoutLink OC: foundation
-- Shared schemas, types, settings, rate limiting and audit logging.
--
-- Security model: the browser only ever holds the publishable key. Row Level
-- Security (RLS) protects every table in `public`. Privileged changes go through
-- SECURITY DEFINER functions that re-check the caller's verified roles. Helper
-- functions live in `private`, which PostgREST does not expose.

-- ---------------------------------------------------------------------------
-- Schemas
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
-- RLS policies call helpers in `private`, so the API role needs USAGE (not exposure).
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.account_state as enum ('pending_verification', 'active', 'suspended', 'deactivated');

create type public.app_role as enum (
  'platform_admin',
  'council_admin',
  'service_unit_coordinator',
  'troop_leader',
  'adult_volunteer',
  'girl_member',
  'guardian'
);

create type public.role_scope as enum ('platform', 'council', 'service_unit', 'troop');
create type public.girl_scout_level as enum ('daisy', 'brownie', 'junior', 'cadette', 'senior', 'ambassador');
create type public.oc_region as enum ('north', 'central', 'south', 'coastal', 'west');
create type public.affiliation_status as enum ('requested', 'approved', 'rejected', 'ended');
create type public.verification_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.data_source as enum ('fictional_demo', 'council_record', 'self_reported');
create type public.collaboration_status as enum ('open', 'limited', 'closed');
create type public.directory_visibility as enum ('council_members', 'public_listing', 'hidden');

-- ---------------------------------------------------------------------------
-- Platform settings (not exposed through the API)
-- ---------------------------------------------------------------------------
create table private.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into private.settings (key, value) values
  -- Youth accounts stay off until the council approves consent and supervision procedures.
  ('youth_access_enabled', 'false'::jsonb),
  -- Version of the Terms of use and Privacy policy users agree to during onboarding.
  ('policy_version', '"2026-11-draft"'::jsonb);

create function private.setting(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select value from private.settings where key = p_key;
$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting
-- ---------------------------------------------------------------------------
create table private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

-- Counts one hit in a fixed window and raises 'rate_limited' when the limit is exceeded.
create function private.check_rate_limit(p_bucket text, p_max integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_bin(p_window, now(), timestamptz '2000-01-01 00:00:00+00');
  v_hits integer;
begin
  insert into private.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  if v_hits > p_max then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Too many attempts. Please wait and try again.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null check (char_length(action) <= 80),
  target_type text check (char_length(target_type) <= 40),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_target_idx on public.audit_logs (target_type, target_id);

-- Never pass passwords, tokens or message bodies in p_metadata.
create function private.audit(p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
$$;

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;

-- Lock down every helper; RLS-facing helpers are re-granted where they're defined.
revoke all on all functions in schema private from public, anon, authenticated;
