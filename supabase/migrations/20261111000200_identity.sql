-- ScoutLink OC: identity, organizations, roles and verification
--
-- Roles come only from `role_assignments`, which no user can write directly.
-- A person is "active" only after an administrator verifies them; until then
-- they can read their own account and nothing else.

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
create table public.service_units (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  code text check (char_length(code) <= 20),
  region public.oc_region not null,
  description text not null default '' check (char_length(description) <= 2000),
  founded_year integer check (founded_year between 1912 and 2100),
  founded_year_source public.data_source,
  visibility public.directory_visibility not null default 'council_members',
  is_demo boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index service_units_name_active_idx on public.service_units (lower(name)) where archived_at is null;

create table public.troops (
  id uuid primary key default gen_random_uuid(),
  number text not null check (number ~ '^[0-9A-Za-z-]{1,12}$'),
  service_unit_id uuid not null references public.service_units (id) on delete restrict,
  introduction text not null default '' check (char_length(introduction) <= 2000),
  approx_size integer check (approx_size between 0 and 500),
  size_source public.data_source,
  size_as_of date,
  founded_year integer check (founded_year between 1912 and 2100),
  founded_year_source public.data_source,
  collaboration_status public.collaboration_status not null default 'open',
  visibility public.directory_visibility not null default 'council_members',
  is_demo boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Official-looking numbers must say where they came from.
  constraint troops_size_provenance check (approx_size is null or size_source is not null),
  constraint troops_founded_provenance check (founded_year is null or founded_year_source is not null)
);

create unique index troops_number_active_idx on public.troops (number) where archived_at is null;
create index troops_service_unit_idx on public.troops (service_unit_id);

-- A service unit's levels are derived from its troops; never stored on the service unit.
create table public.troop_levels (
  troop_id uuid not null references public.troops (id) on delete cascade,
  level public.girl_scout_level not null,
  primary key (troop_id, level)
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  bio text not null default '' check (char_length(bio) <= 600),
  interests text[] not null default '{}' check (cardinality(interests) <= 12),
  general_location text not null default '' check (char_length(general_location) <= 80),
  account_state public.account_state not null default 'pending_verification',
  state_reason text check (char_length(state_reason) <= 500),
  deletion_requested_at timestamptz,
  deletion_reason text check (char_length(deletion_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  scope_type public.role_scope not null,
  scope_id uuid,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null,
  constraint role_assignments_scope_matches_role check (
    (role = 'platform_admin' and scope_type = 'platform' and scope_id is null)
    or (role = 'council_admin' and scope_type = 'council' and scope_id is null)
    or (role = 'guardian' and scope_type = 'council' and scope_id is null)
    or (role = 'service_unit_coordinator' and scope_type = 'service_unit' and scope_id is not null)
    or (role in ('troop_leader', 'adult_volunteer', 'girl_member') and scope_type = 'troop' and scope_id is not null)
  )
);

create unique index role_assignments_active_idx
  on public.role_assignments (profile_id, role, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;
create index role_assignments_profile_idx on public.role_assignments (profile_id) where revoked_at is null;

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  requested_role public.app_role not null,
  service_unit_id uuid not null references public.service_units (id) on delete restrict,
  troop_id uuid references public.troops (id) on delete restrict,
  note text not null default '' check (char_length(note) <= 1000),
  status public.verification_status not null default 'pending',
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decision_note text check (char_length(decision_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index verification_requests_one_pending_idx on public.verification_requests (profile_id) where status = 'pending';
create index verification_requests_status_idx on public.verification_requests (status, created_at);

create table public.troop_affiliations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  troop_id uuid not null references public.troops (id) on delete cascade,
  status public.affiliation_status not null default 'requested',
  verification_request_id uuid references public.verification_requests (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index troop_affiliations_current_idx on public.troop_affiliations (profile_id, troop_id) where status in ('requested', 'approved');
create index troop_affiliations_troop_idx on public.troop_affiliations (troop_id, status);

create table public.service_unit_affiliations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  service_unit_id uuid not null references public.service_units (id) on delete cascade,
  status public.affiliation_status not null default 'requested',
  verification_request_id uuid references public.verification_requests (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index service_unit_affiliations_current_idx on public.service_unit_affiliations (profile_id, service_unit_id) where status in ('requested', 'approved');
create index service_unit_affiliations_su_idx on public.service_unit_affiliations (service_unit_id, status);

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- Youth and guardian consent types are deliberately absent until procedures are approved.
  consent_type text not null check (consent_type in ('terms_and_privacy')),
  policy_version text not null check (char_length(policy_version) <= 40),
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (profile_id, consent_type, policy_version)
);

-- Future, gated capability: no policies, so nobody can read or write it through the API.
create table public.guardian_relationships (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'ended')),
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (guardian_id, member_id)
);

-- Public contact form. Inserted only through submit_contact_message().
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254),
  topic text not null check (topic in ('general', 'pilot', 'accessibility', 'safety', 'bug')),
  message text not null check (char_length(message) between 20 and 2000),
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger service_units_updated_at before update on public.service_units for each row execute function private.set_updated_at();
create trigger troops_updated_at before update on public.troops for each row execute function private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger verification_requests_updated_at before update on public.verification_requests for each row execute function private.set_updated_at();
create trigger troop_affiliations_updated_at before update on public.troop_affiliations for each row execute function private.set_updated_at();
create trigger service_unit_affiliations_updated_at before update on public.service_unit_affiliations for each row execute function private.set_updated_at();

-- Interest tags are short plain-text labels.
create function private.validate_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.display_name := btrim(new.display_name);
  new.general_location := btrim(new.general_location);
  if exists (select 1 from unnest(new.interests) as tag where char_length(btrim(tag)) not between 1 and 40) then
    raise exception 'invalid_interests' using errcode = 'P0001', hint = 'Each interest must be 1 to 40 characters.';
  end if;
  return new;
end;
$$;

create trigger profiles_validate before insert or update on public.profiles for each row execute function private.validate_profile();

-- ---------------------------------------------------------------------------
-- New users get a pending profile automatically.
-- ---------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Authorization helpers (used by RLS policies)
-- ---------------------------------------------------------------------------
create function private.current_account_state()
returns public.account_state
language sql
stable
security definer
set search_path = ''
as $$
  select account_state from public.profiles where id = (select auth.uid());
$$;

create function private.is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_account_state()) = 'active', false);
$$;

-- True when the caller is active and holds the role (any scope).
create function private.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_active()) and exists (
    select 1 from public.role_assignments
    where profile_id = (select auth.uid()) and role = p_role and revoked_at is null
  );
$$;

-- True when the caller is active and holds the role for this exact scope.
create function private.has_scoped_role(p_role public.app_role, p_scope_type public.role_scope, p_scope_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_active()) and exists (
    select 1 from public.role_assignments
    where profile_id = (select auth.uid())
      and role = p_role
      and scope_type = p_scope_type
      and scope_id is not distinct from p_scope_id
      and revoked_at is null
  );
$$;

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('platform_admin');
$$;

-- Administrators who can verify volunteers and manage organization records.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('platform_admin') or private.has_role('council_admin');
$$;

-- Nothing in `private` is callable by API roles except these read-only helpers used by policies.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.current_account_state(),
  private.is_active(),
  private.has_role(public.app_role),
  private.has_scoped_role(public.app_role, public.role_scope, uuid),
  private.is_platform_admin(),
  private.is_admin()
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.service_units enable row level security;
alter table public.troops enable row level security;
alter table public.troop_levels enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.verification_requests enable row level security;
alter table public.troop_affiliations enable row level security;
alter table public.service_unit_affiliations enable row level security;
alter table public.user_consents enable row level security;
alter table public.guardian_relationships enable row level security;
alter table public.contact_messages enable row level security;

-- Start from nothing: Supabase grants broad table privileges by default.
revoke all on table
  public.service_units, public.troops, public.troop_levels, public.profiles, public.role_assignments,
  public.verification_requests, public.troop_affiliations, public.service_unit_affiliations,
  public.user_consents, public.guardian_relationships, public.contact_messages
from anon, authenticated;

-- Organizations: verified members can read non-hidden records; admins can read everything.
grant select on public.service_units, public.troops, public.troop_levels to authenticated;

create policy "verified members read visible service units" on public.service_units
  for select to authenticated
  using (((select private.is_active()) and archived_at is null and visibility <> 'hidden') or (select private.is_admin()));

create policy "verified members read visible troops" on public.troops
  for select to authenticated
  using (((select private.is_active()) and archived_at is null and visibility <> 'hidden') or (select private.is_admin()));

create policy "verified members read troop levels" on public.troop_levels
  for select to authenticated
  using (exists (select 1 from public.troops t where t.id = troop_id));

-- Profiles: you can read your own; admins can read all. You can edit only a few columns.
grant select on public.profiles to authenticated;
grant update (display_name, bio, interests, general_location) on public.profiles to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "admins read profiles" on public.profiles
  for select to authenticated
  using ((select private.is_admin()));

create policy "edit own profile while pending or active" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and (select private.current_account_state()) in ('pending_verification', 'active'))
  with check (id = (select auth.uid()));

-- Roles, requests, affiliations and consents: read your own; admins read all. No direct writes.
grant select on public.role_assignments, public.verification_requests, public.troop_affiliations,
  public.service_unit_affiliations, public.user_consents to authenticated;

create policy "read own roles" on public.role_assignments
  for select to authenticated using (profile_id = (select auth.uid()) or (select private.is_admin()));

create policy "read own verification requests" on public.verification_requests
  for select to authenticated using (profile_id = (select auth.uid()) or (select private.is_admin()));

create policy "read own troop affiliations" on public.troop_affiliations
  for select to authenticated using (profile_id = (select auth.uid()) or (select private.is_admin()));

create policy "read own service unit affiliations" on public.service_unit_affiliations
  for select to authenticated using (profile_id = (select auth.uid()) or (select private.is_admin()));

create policy "read own consents" on public.user_consents
  for select to authenticated using (profile_id = (select auth.uid()));

-- Audit logs and contact messages: administrators only.
grant select on public.audit_logs, public.contact_messages to authenticated;

create policy "admins read audit logs" on public.audit_logs
  for select to authenticated using ((select private.is_admin()));

create policy "admins read contact messages" on public.contact_messages
  for select to authenticated using ((select private.is_admin()));

-- guardian_relationships: RLS on, no grants, no policies (future gated capability).
