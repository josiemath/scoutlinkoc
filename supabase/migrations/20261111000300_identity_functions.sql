-- ScoutLink OC: account, verification and administration functions
--
-- These SECURITY DEFINER functions are the only way to change roles, account
-- states, affiliations and verification requests. Each one checks the caller's
-- identity and verified roles itself; none trusts values sent by the browser.
-- Errors use short codes in the message (for example 'forbidden') that the app
-- translates into plain language.

-- ---------------------------------------------------------------------------
-- Your own account
-- ---------------------------------------------------------------------------

-- Everything the signed-in person may see about their own account, in one call.
create function public.get_my_account()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'id', p.id,
    'email', u.email,
    'display_name', p.display_name,
    'bio', p.bio,
    'interests', to_jsonb(p.interests),
    'general_location', p.general_location,
    'account_state', p.account_state,
    'state_reason', p.state_reason,
    'deletion_requested_at', p.deletion_requested_at,
    'created_at', p.created_at,
    'policy_version', private.setting('policy_version') #>> '{}',
    'has_current_consent', exists (
      select 1 from public.user_consents c
      where c.profile_id = p.id and c.consent_type = 'terms_and_privacy'
        and c.policy_version = private.setting('policy_version') #>> '{}' and c.withdrawn_at is null
    ),
    'roles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'role', r.role,
        'scope_type', r.scope_type,
        'scope_id', r.scope_id,
        'scope_name', case r.scope_type
          when 'troop' then (select 'Troop ' || t.number from public.troops t where t.id = r.scope_id)
          when 'service_unit' then (select s.name from public.service_units s where s.id = r.scope_id)
          when 'council' then 'Council'
          else 'Platform'
        end,
        'granted_at', r.granted_at
      ) order by r.granted_at)
      from public.role_assignments r
      where r.profile_id = p.id and r.revoked_at is null
    ), '[]'::jsonb),
    'latest_request', (
      select jsonb_build_object(
        'id', v.id,
        'requested_role', v.requested_role,
        'service_unit_id', v.service_unit_id,
        'service_unit_name', s.name,
        'troop_id', v.troop_id,
        'troop_number', t.number,
        'note', v.note,
        'status', v.status,
        'decision_note', v.decision_note,
        'created_at', v.created_at,
        'decided_at', v.decided_at
      )
      from public.verification_requests v
      join public.service_units s on s.id = v.service_unit_id
      left join public.troops t on t.id = v.troop_id
      where v.profile_id = p.id
      order by v.created_at desc
      limit 1
    )
  )
  into v_result
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = v_uid;

  if v_result is null then
    raise exception 'profile_missing' using errcode = 'P0001';
  end if;
  return v_result;
end;
$$;

-- Service units and troops a person can choose during onboarding (names and numbers only).
create function public.list_affiliation_options()
returns table (service_unit_id uuid, service_unit_name text, region public.oc_region, troop_id uuid, troop_number text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.region, t.id, t.number
  from public.service_units s
  left join public.troops t
    on t.service_unit_id = s.id and t.archived_at is null and t.visibility <> 'hidden'
  where (select auth.uid()) is not null
    and s.archived_at is null and s.visibility <> 'hidden'
  order by s.name, t.number;
$$;

-- Onboarding: asks to be verified for a role. Choosing a role here grants nothing.
create function public.submit_onboarding(
  p_display_name text,
  p_requested_role public.app_role,
  p_service_unit_id uuid,
  p_troop_id uuid,
  p_interests text[],
  p_note text,
  p_policy_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_state public.account_state;
  v_name text := btrim(coalesce(p_display_name, ''));
  v_note text := btrim(coalesce(p_note, ''));
  v_interests text[] := coalesce((select array_agg(btrim(x)) from unnest(coalesce(p_interests, '{}')) as x where btrim(x) <> ''), '{}');
  v_request_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select account_state into v_state from public.profiles where id = v_uid;
  if v_state is null then
    raise exception 'profile_missing' using errcode = 'P0001';
  elsif v_state not in ('pending_verification', 'active') then
    raise exception 'account_not_eligible' using errcode = 'P0001';
  end if;

  perform private.check_rate_limit('onboarding:' || v_uid::text, 5, interval '1 day');

  if char_length(v_name) not between 2 and 80 then
    raise exception 'invalid_display_name' using errcode = 'P0001';
  end if;
  if p_requested_role not in ('troop_leader', 'adult_volunteer', 'service_unit_coordinator') then
    raise exception 'role_not_requestable' using errcode = 'P0001';
  end if;
  if cardinality(v_interests) > 12 or exists (select 1 from unnest(v_interests) x where char_length(x) > 40) then
    raise exception 'invalid_interests' using errcode = 'P0001';
  end if;
  if char_length(v_note) > 1000 then
    raise exception 'invalid_note' using errcode = 'P0001';
  end if;
  if p_policy_version is distinct from (private.setting('policy_version') #>> '{}') then
    raise exception 'policy_version_mismatch' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.service_units
    where id = p_service_unit_id and archived_at is null and visibility <> 'hidden'
  ) then
    raise exception 'invalid_service_unit' using errcode = 'P0001';
  end if;

  if p_requested_role in ('troop_leader', 'adult_volunteer') and p_troop_id is null then
    raise exception 'troop_required' using errcode = 'P0001';
  end if;
  if p_troop_id is not null and not exists (
    select 1 from public.troops
    where id = p_troop_id and service_unit_id = p_service_unit_id and archived_at is null and visibility <> 'hidden'
  ) then
    raise exception 'invalid_troop' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.verification_requests where profile_id = v_uid and status = 'pending') then
    raise exception 'request_pending' using errcode = 'P0001';
  end if;

  update public.profiles set display_name = v_name, interests = v_interests where id = v_uid;

  insert into public.user_consents (profile_id, consent_type, policy_version)
  values (v_uid, 'terms_and_privacy', p_policy_version)
  on conflict (profile_id, consent_type, policy_version) do nothing;

  insert into public.verification_requests (profile_id, requested_role, service_unit_id, troop_id, note)
  values (v_uid, p_requested_role, p_service_unit_id, p_troop_id, v_note)
  returning id into v_request_id;

  insert into public.service_unit_affiliations (profile_id, service_unit_id, verification_request_id)
  select v_uid, p_service_unit_id, v_request_id
  where not exists (
    select 1 from public.service_unit_affiliations
    where profile_id = v_uid and service_unit_id = p_service_unit_id and status in ('requested', 'approved')
  );

  if p_troop_id is not null then
    insert into public.troop_affiliations (profile_id, troop_id, verification_request_id)
    select v_uid, p_troop_id, v_request_id
    where not exists (
      select 1 from public.troop_affiliations
      where profile_id = v_uid and troop_id = p_troop_id and status in ('requested', 'approved')
    );
  end if;

  perform private.audit('verification.requested', 'verification_request', v_request_id,
    jsonb_build_object('requested_role', p_requested_role, 'service_unit_id', p_service_unit_id, 'troop_id', p_troop_id));

  return v_request_id;
end;
$$;

-- Withdraws your own pending request (for example, to fix a mistake).
create function public.withdraw_my_verification_request()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_request_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  update public.verification_requests set status = 'withdrawn', decided_at = now()
  where profile_id = v_uid and status = 'pending'
  returning id into v_request_id;

  if v_request_id is null then
    raise exception 'no_pending_request' using errcode = 'P0001';
  end if;

  update public.troop_affiliations set status = 'ended', decided_at = now()
  where verification_request_id = v_request_id and status = 'requested';
  update public.service_unit_affiliations set status = 'ended', decided_at = now()
  where verification_request_id = v_request_id and status = 'requested';

  perform private.audit('verification.withdrawn', 'verification_request', v_request_id);
end;
$$;

-- Deactivates your own account. Reactivation needs an administrator.
create function public.deactivate_my_account(p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  -- Suspended accounts stay suspended: deactivating must not erase an administrator's decision.
  update public.profiles
  set account_state = 'deactivated', state_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 500)
  where id = v_uid and account_state in ('pending_verification', 'active');
  if not found then
    raise exception 'account_not_eligible' using errcode = 'P0001';
  end if;
  perform private.audit('account.deactivated_by_self', 'profile', v_uid);
end;
$$;

-- Records a deletion request and deactivates the account until an administrator completes it.
create function public.request_my_account_deletion(p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  update public.profiles
  set deletion_requested_at = coalesce(deletion_requested_at, now()),
      deletion_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 500),
      account_state = case when account_state = 'suspended' then account_state else 'deactivated' end
  where id = v_uid;
  perform private.audit('account.deletion_requested', 'profile', v_uid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Administration
-- ---------------------------------------------------------------------------

-- Verification queue with the details an administrator needs to confirm identity.
create function public.admin_list_verification_requests(p_status public.verification_status default 'pending')
returns table (
  id uuid,
  profile_id uuid,
  display_name text,
  email text,
  requested_role public.app_role,
  service_unit_id uuid,
  service_unit_name text,
  troop_id uuid,
  troop_number text,
  note text,
  status public.verification_status,
  decision_note text,
  created_at timestamptz,
  decided_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  return query
  select v.id, v.profile_id, p.display_name, u.email::text, v.requested_role, v.service_unit_id, s.name,
         v.troop_id, t.number, v.note, v.status, v.decision_note, v.created_at, v.decided_at
  from public.verification_requests v
  join public.profiles p on p.id = v.profile_id
  join auth.users u on u.id = v.profile_id
  join public.service_units s on s.id = v.service_unit_id
  left join public.troops t on t.id = v.troop_id
  where v.status = p_status
  order by v.created_at
  limit 200;
end;
$$;

-- Internal: grants a role after checking the granting administrator's authority.
create function private.grant_role_checked(
  p_profile_id uuid,
  p_role public.app_role,
  p_scope_type public.role_scope,
  p_scope_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if p_profile_id = v_uid then
    raise exception 'cannot_change_own_roles' using errcode = 'P0001';
  end if;
  if p_role in ('platform_admin', 'council_admin') and not private.is_platform_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if p_role in ('girl_member', 'guardian') and coalesce((private.setting('youth_access_enabled'))::boolean, false) is not true then
    raise exception 'youth_access_disabled' using errcode = 'P0001';
  end if;
  if p_scope_type = 'troop' and not exists (select 1 from public.troops where id = p_scope_id and archived_at is null) then
    raise exception 'invalid_scope' using errcode = 'P0001';
  end if;
  if p_scope_type = 'service_unit' and not exists (select 1 from public.service_units where id = p_scope_id and archived_at is null) then
    raise exception 'invalid_scope' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_id) then
    raise exception 'invalid_profile' using errcode = 'P0001';
  end if;

  select id into v_id from public.role_assignments
  where profile_id = p_profile_id and role = p_role and scope_type = p_scope_type
    and scope_id is not distinct from p_scope_id and revoked_at is null;

  if v_id is null then
    insert into public.role_assignments (profile_id, role, scope_type, scope_id, granted_by)
    values (p_profile_id, p_role, p_scope_type, p_scope_id, v_uid)
    returning id into v_id;
    perform private.audit('role.granted', 'profile', p_profile_id,
      jsonb_build_object('role', p_role, 'scope_type', p_scope_type, 'scope_id', p_scope_id, 'assignment_id', v_id));
  end if;
  return v_id;
end;
$$;

-- Approves or rejects a verification request.
create function public.admin_decide_verification(p_request_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_request public.verification_requests%rowtype;
  v_note text := left(nullif(btrim(coalesce(p_note, '')), ''), 1000);
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  select * into v_request from public.verification_requests where id = p_request_id for update;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'request_not_pending' using errcode = 'P0001';
  end if;
  if v_request.profile_id = v_uid then
    raise exception 'cannot_review_own_request' using errcode = 'P0001';
  end if;

  if p_approve then
    if v_request.requested_role = 'service_unit_coordinator' then
      perform private.grant_role_checked(v_request.profile_id, 'service_unit_coordinator', 'service_unit', v_request.service_unit_id);
    else
      perform private.grant_role_checked(v_request.profile_id, v_request.requested_role, 'troop', v_request.troop_id);
    end if;

    update public.service_unit_affiliations set status = 'approved', decided_by = v_uid, decided_at = now()
    where verification_request_id = p_request_id and status = 'requested';
    update public.troop_affiliations set status = 'approved', decided_by = v_uid, decided_at = now()
    where verification_request_id = p_request_id and status = 'requested';
    update public.profiles set account_state = 'active', state_reason = null
    where id = v_request.profile_id and account_state = 'pending_verification';
    update public.verification_requests set status = 'approved', decided_by = v_uid, decided_at = now(), decision_note = v_note
    where id = p_request_id;
    perform private.audit('verification.approved', 'verification_request', p_request_id,
      jsonb_build_object('profile_id', v_request.profile_id, 'role', v_request.requested_role));
  else
    if v_note is null then
      raise exception 'reason_required' using errcode = 'P0001';
    end if;
    update public.service_unit_affiliations set status = 'rejected', decided_by = v_uid, decided_at = now()
    where verification_request_id = p_request_id and status = 'requested';
    update public.troop_affiliations set status = 'rejected', decided_by = v_uid, decided_at = now()
    where verification_request_id = p_request_id and status = 'requested';
    update public.verification_requests set status = 'rejected', decided_by = v_uid, decided_at = now(), decision_note = v_note
    where id = p_request_id;
    perform private.audit('verification.rejected', 'verification_request', p_request_id,
      jsonb_build_object('profile_id', v_request.profile_id));
  end if;
end;
$$;

create function public.admin_grant_role(p_profile_id uuid, p_role public.app_role, p_scope_type public.role_scope, p_scope_id uuid default null)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.grant_role_checked(p_profile_id, p_role, p_scope_type, p_scope_id);
$$;

create function public.admin_revoke_role(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_assignment public.role_assignments%rowtype;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  select * into v_assignment from public.role_assignments where id = p_assignment_id and revoked_at is null for update;
  if not found then
    raise exception 'assignment_not_found' using errcode = 'P0001';
  end if;
  if v_assignment.profile_id = v_uid then
    raise exception 'cannot_change_own_roles' using errcode = 'P0001';
  end if;
  if v_assignment.role in ('platform_admin', 'council_admin') and not private.is_platform_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  update public.role_assignments set revoked_at = now(), revoked_by = v_uid where id = p_assignment_id;
  perform private.audit('role.revoked', 'profile', v_assignment.profile_id,
    jsonb_build_object('role', v_assignment.role, 'assignment_id', p_assignment_id));
end;
$$;

-- Suspends, reactivates or deactivates someone else's account.
create function public.admin_set_account_state(p_profile_id uuid, p_state public.account_state, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_reason text := left(nullif(btrim(coalesce(p_reason, '')), ''), 500);
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if p_profile_id = v_uid then
    raise exception 'cannot_change_own_state' using errcode = 'P0001';
  end if;
  if v_reason is null then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;
  if p_state = 'pending_verification' then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  -- Only platform administrators can change other administrators' accounts.
  if exists (
    select 1 from public.role_assignments
    where profile_id = p_profile_id and role in ('platform_admin', 'council_admin') and revoked_at is null
  ) and not private.is_platform_admin() then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  update public.profiles set account_state = p_state, state_reason = v_reason where id = p_profile_id;
  if not found then
    raise exception 'invalid_profile' using errcode = 'P0001';
  end if;
  perform private.audit('account.state_changed', 'profile', p_profile_id, jsonb_build_object('state', p_state));
end;
$$;

-- One-time setup, run by the project owner in the Supabase SQL editor (never through the API):
--   select private.bootstrap_platform_admin('you@example.org');
-- It only works while no platform administrator exists.
create function private.bootstrap_platform_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_assignment_id uuid;
begin
  if exists (select 1 from public.role_assignments where role = 'platform_admin' and revoked_at is null) then
    raise exception 'platform_admin_exists' using errcode = 'P0001',
      hint = 'Ask an existing platform administrator to grant roles instead.';
  end if;

  select id into v_profile_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_profile_id is null then
    raise exception 'user_not_found' using errcode = 'P0001', hint = 'Sign up and confirm your email first.';
  end if;

  insert into public.role_assignments (profile_id, role, scope_type) values (v_profile_id, 'platform_admin', 'platform')
  returning id into v_assignment_id;
  insert into public.role_assignments (profile_id, role, scope_type) values (v_profile_id, 'council_admin', 'council');
  update public.profiles set account_state = 'active', state_reason = null where id = v_profile_id;
  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (null, 'role.bootstrap_platform_admin', 'profile', v_profile_id, '{}'::jsonb);
  return v_assignment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public contact form
-- ---------------------------------------------------------------------------
create function public.submit_contact_message(p_name text, p_email text, p_topic text, p_message text, p_website text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
  v_forwarded text := split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1);
begin
  -- Honeypot: people never see this field. Bots that fill it are dropped without storing anything.
  if coalesce(p_website, '') <> '' then
    return;
  end if;

  if char_length(v_name) not between 2 and 80 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if p_topic not in ('general', 'pilot', 'accessibility', 'safety', 'bug') then
    raise exception 'invalid_topic' using errcode = 'P0001';
  end if;
  if char_length(v_message) not between 20 and 2000 then
    raise exception 'invalid_message' using errcode = 'P0001';
  end if;

  -- Limits per sender, per network address (stored only as a hash) and overall.
  perform private.check_rate_limit('contact:email:' || md5(v_email), 3, interval '1 hour');
  if btrim(v_forwarded) <> '' then
    perform private.check_rate_limit('contact:ip:' || md5(btrim(v_forwarded)), 10, interval '1 hour');
  end if;
  perform private.check_rate_limit('contact:all', 200, interval '1 hour');

  insert into public.contact_messages (name, email, topic, message) values (v_name, v_email, p_topic, v_message);
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges: deny by default, then allow exactly what each role needs.
-- ---------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.current_account_state(),
  private.is_active(),
  private.has_role(public.app_role),
  private.has_scoped_role(public.app_role, public.role_scope, uuid),
  private.is_platform_admin(),
  private.is_admin()
to authenticated, service_role;

revoke all on function
  public.get_my_account(),
  public.list_affiliation_options(),
  public.submit_onboarding(text, public.app_role, uuid, uuid, text[], text, text),
  public.withdraw_my_verification_request(),
  public.deactivate_my_account(text),
  public.request_my_account_deletion(text),
  public.admin_list_verification_requests(public.verification_status),
  public.admin_decide_verification(uuid, boolean, text),
  public.admin_grant_role(uuid, public.app_role, public.role_scope, uuid),
  public.admin_revoke_role(uuid),
  public.admin_set_account_state(uuid, public.account_state, text),
  public.submit_contact_message(text, text, text, text, text)
from public, anon, authenticated;

grant execute on function
  public.get_my_account(),
  public.list_affiliation_options(),
  public.submit_onboarding(text, public.app_role, uuid, uuid, text[], text, text),
  public.withdraw_my_verification_request(),
  public.deactivate_my_account(text),
  public.request_my_account_deletion(text),
  public.admin_list_verification_requests(public.verification_status),
  public.admin_decide_verification(uuid, boolean, text),
  public.admin_grant_role(uuid, public.app_role, public.role_scope, uuid),
  public.admin_revoke_role(uuid),
  public.admin_set_account_state(uuid, public.account_state, text)
to authenticated;

grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
