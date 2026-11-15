-- Identity, verification and role security tests.
-- Run with `npx supabase test db` (pgTAP) or `bash supabase/tests/local/run.sh`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(58);

-- ---------------------------------------------------------------------------
-- Test helpers (rolled back with the transaction)
-- ---------------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.create_user(p_email text) returns uuid
language sql security definer set search_path = '' as $$
  insert into auth.users (email) values (p_email) returning id;
$$;

create function tests.uid(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where email = p_email;
$$;

-- Sets the JWT claims Supabase would set for this user. Call before `set local role authenticated`.
create function tests.login(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', tests.uid(p_email), 'role', 'authenticated')::text, true);
end;
$$;

-- Runs a statement as the current role and reports how many rows it changed.
create function tests.rows_affected(p_sql text) returns integer
language plpgsql as $$
declare
  v_count integer;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into public.service_units (id, name, region) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test SU', 'north'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Other SU', 'south');

insert into public.troops (id, number, service_unit_id, visibility) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'T1', 'aaaaaaaa-0000-4000-8000-000000000001', 'council_members'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'T2', 'aaaaaaaa-0000-4000-8000-000000000001', 'hidden'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'T3', 'aaaaaaaa-0000-4000-8000-000000000002', 'council_members');

select tests.create_user('alice@test.local');
select tests.create_user('bob@test.local');
select tests.create_user('carol@test.local');
select tests.create_user('dave@test.local');
select tests.create_user('erin@test.local');
select private.bootstrap_platform_admin('dave@test.local');

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select ok(
  not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  ),
  'RLS is enabled on every table in public'
);
select is((select account_state from public.profiles where id = tests.uid('alice@test.local')), 'pending_verification'::public.account_state,
  'new sign-ups start as pending verification');
select throws_ok($$select private.bootstrap_platform_admin('carol@test.local')$$, 'P0001', 'platform_admin_exists',
  'a second platform admin cannot be bootstrapped');

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.profiles', '42501', 'permission denied for table profiles', 'visitors cannot read profiles');
select throws_ok('select * from public.troops', '42501', 'permission denied for table troops', 'visitors cannot read the troop directory');
select throws_ok('select * from public.role_assignments', '42501', 'permission denied for table role_assignments', 'visitors cannot read roles');
select throws_ok('select public.get_my_account()', '42501', 'permission denied for function get_my_account', 'visitors cannot call account functions');
select throws_ok('select private.is_admin()', '42501', 'permission denied for schema private', 'visitors cannot reach private helpers');
reset role;

-- ---------------------------------------------------------------------------
-- A pending (unverified) user
-- ---------------------------------------------------------------------------
select tests.login('alice@test.local');
set local role authenticated;
select is((select count(*) from public.profiles), 1::bigint, 'a pending user sees only her own profile');
select is_empty('select * from public.troops', 'a pending user cannot read the troop directory');
select is_empty('select * from public.service_units', 'a pending user cannot read service unit records');
select is(tests.rows_affected('update public.profiles set display_name = ''Alice A'' where id = auth.uid()'), 1,
  'a user can edit her own display name');
select throws_ok('update public.profiles set account_state = ''active''', '42501', 'permission denied for table profiles',
  'a user cannot change her own account state');
select is(tests.rows_affected(format('update public.profiles set display_name = %L where id = %L', 'Hacked', tests.uid('bob@test.local'))), 0,
  'a user cannot edit someone else''s profile');
select throws_ok(
  format('insert into public.role_assignments (profile_id, role, scope_type) values (%L, ''platform_admin'', ''platform'')', tests.uid('alice@test.local')),
  '42501', 'permission denied for table role_assignments', 'a user cannot grant herself a role by writing the table');
select throws_ok(format('select public.admin_grant_role(%L, ''council_admin'', ''council'')', tests.uid('alice@test.local')),
  'P0001', 'forbidden', 'a non-admin cannot grant roles through the API');
select throws_ok('select * from public.admin_list_verification_requests()', 'P0001', 'forbidden',
  'a non-admin cannot read the verification queue');
select throws_ok($$select private.bootstrap_platform_admin('alice@test.local')$$, '42501', 'permission denied for function bootstrap_platform_admin',
  'the bootstrap function is not callable through the API');
select isnt_empty($$select * from public.list_affiliation_options() where troop_number = 'T1'$$,
  'a pending user can list troops to choose during onboarding');
select is_empty($$select * from public.list_affiliation_options() where troop_number = 'T2'$$,
  'hidden troops are not offered during onboarding');
select throws_ok($$select public.submit_onboarding('Alice A', 'platform_admin', 'aaaaaaaa-0000-4000-8000-000000000001', null, '{}', '', '2026-11-draft')$$,
  'P0001', 'role_not_requestable', 'administrator roles cannot be requested');
select throws_ok($$select public.submit_onboarding('Alice A', 'troop_leader', 'aaaaaaaa-0000-4000-8000-000000000001', null, '{}', '', '2026-11-draft')$$,
  'P0001', 'troop_required', 'troop roles require a troop');
select throws_ok($$select public.submit_onboarding('Alice A', 'troop_leader', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003', '{}', '', '2026-11-draft')$$,
  'P0001', 'invalid_troop', 'the troop must belong to the chosen service unit');
select throws_ok($$select public.submit_onboarding('Alice A', 'troop_leader', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '{}', '', 'old-version')$$,
  'P0001', 'policy_version_mismatch', 'the current policies must be accepted');
select lives_ok($$select public.submit_onboarding('Alice A', 'troop_leader', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '{STEM,Service}', 'I lead Troop T1.', '2026-11-draft')$$,
  'a pending user can request verification');
select throws_ok($$select public.submit_onboarding('Alice A', 'troop_leader', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '{}', '', '2026-11-draft')$$,
  'P0001', 'request_pending', 'only one pending request at a time');
select is(public.get_my_account() ->> 'account_state', 'pending_verification', 'requesting a role does not activate the account');
select is((select count(*) from public.role_assignments), 0::bigint, 'requesting a role grants no roles');
reset role;

-- ---------------------------------------------------------------------------
-- Another user can't see Alice's request
-- ---------------------------------------------------------------------------
select tests.login('bob@test.local');
set local role authenticated;
select is_empty('select * from public.verification_requests', 'users cannot see other people''s verification requests');
select is_empty('select * from public.troop_affiliations', 'users cannot see other people''s affiliations');
select is_empty('select * from public.audit_logs', 'non-admins cannot read the audit log');
select throws_ok('insert into public.audit_logs (action) values (''forged'')', '42501', 'permission denied for table audit_logs',
  'nobody can write the audit log directly');
select throws_ok('select * from public.guardian_relationships', '42501', 'permission denied for table guardian_relationships',
  'guardian records are unreachable until youth access is approved');
reset role;

-- ---------------------------------------------------------------------------
-- Platform administrator
-- ---------------------------------------------------------------------------
select tests.login('dave@test.local');
set local role authenticated;
select throws_ok(format('select public.admin_grant_role(%L, ''council_admin'', ''council'')', tests.uid('dave@test.local')),
  'P0001', 'cannot_change_own_roles', 'admins cannot change their own roles');
select lives_ok(format('select public.admin_grant_role(%L, ''council_admin'', ''council'')', tests.uid('carol@test.local')),
  'a platform admin can appoint a council admin');
select lives_ok(format('select public.admin_set_account_state(%L, ''active'', ''Verified by the council office'')', tests.uid('carol@test.local')),
  'a platform admin can activate an administrator');
select throws_ok(format('select public.admin_grant_role(%L, ''girl_member'', ''troop'', %L)', tests.uid('bob@test.local'), 'bbbbbbbb-0000-4000-8000-000000000001'),
  'P0001', 'youth_access_disabled', 'youth roles cannot be granted while youth access is off');
reset role;

-- ---------------------------------------------------------------------------
-- Council administrator reviews Alice
-- ---------------------------------------------------------------------------
select tests.login('carol@test.local');
set local role authenticated;
select isnt_empty('select * from public.admin_list_verification_requests()', 'a council admin can read the verification queue');
select throws_ok(format('select public.admin_grant_role(%L, ''council_admin'', ''council'')', tests.uid('bob@test.local')),
  'P0001', 'forbidden', 'council admins cannot appoint other admins');
select throws_ok(format('select public.admin_set_account_state(%L, ''suspended'', ''test'')', tests.uid('dave@test.local')),
  'P0001', 'forbidden', 'council admins cannot suspend a platform admin');
select throws_ok(format('select public.admin_decide_verification(%L, false, null)',
    (select id from public.verification_requests where profile_id = tests.uid('alice@test.local'))),
  'P0001', 'reason_required', 'rejecting a request requires a reason');
select lives_ok(format('select public.admin_decide_verification(%L, true, ''Confirmed with the service unit'')',
    (select id from public.verification_requests where profile_id = tests.uid('alice@test.local'))),
  'a council admin can approve a request');
reset role;

select is((select account_state from public.profiles where id = tests.uid('alice@test.local')), 'active'::public.account_state,
  'approval activates the account');
select is(
  (select count(*) from public.role_assignments
   where profile_id = tests.uid('alice@test.local') and role = 'troop_leader'
     and scope_id = 'bbbbbbbb-0000-4000-8000-000000000001' and revoked_at is null),
  1::bigint, 'approval grants the requested role for the requested troop only');

-- ---------------------------------------------------------------------------
-- Alice, now verified
-- ---------------------------------------------------------------------------
select tests.login('alice@test.local');
set local role authenticated;
select isnt_empty('select * from public.troops', 'a verified member can read the troop directory');
select is_empty($$select * from public.troops where number = 'T2'$$, 'hidden troops stay hidden from members');
select is_empty(format('select * from public.profiles where id = %L', tests.uid('bob@test.local')),
  'members cannot read other members'' private profiles');
reset role;

-- ---------------------------------------------------------------------------
-- Suspension takes effect immediately
-- ---------------------------------------------------------------------------
select tests.login('carol@test.local');
set local role authenticated;
select lives_ok(format('select public.admin_set_account_state(%L, ''suspended'', ''Investigating a report'')', tests.uid('alice@test.local')),
  'an admin can suspend a member');
select lives_ok($$select public.submit_onboarding('Carol C', 'service_unit_coordinator', 'aaaaaaaa-0000-4000-8000-000000000001', null, '{}', '', '2026-11-draft')$$,
  'an active admin can request an additional role');
select throws_ok(format('select public.admin_decide_verification(%L, true, null)',
    (select id from public.verification_requests where profile_id = tests.uid('carol@test.local') and status = 'pending')),
  'P0001', 'cannot_review_own_request', 'admins cannot approve their own requests');
reset role;

select tests.login('alice@test.local');
set local role authenticated;
select is_empty('select * from public.troops', 'suspended members lose directory access immediately');
select is(public.get_my_account() ->> 'account_state', 'suspended', 'suspended members can still see their own account status');
reset role;

-- ---------------------------------------------------------------------------
-- Deletion requests
-- ---------------------------------------------------------------------------
select tests.login('erin@test.local');
set local role authenticated;
select lives_ok($$select public.request_my_account_deletion('Moving away')$$, 'a user can request account deletion');
select ok(public.get_my_account() ->> 'deletion_requested_at' is not null and public.get_my_account() ->> 'account_state' = 'deactivated',
  'the deletion request is recorded and the account is deactivated');
reset role;

-- Suspended members can't use deactivation to clear a suspension
select tests.login('alice@test.local');
set local role authenticated;
select throws_ok($$select public.deactivate_my_account('leaving')$$, 'P0001', 'account_not_eligible',
  'a suspended member cannot deactivate to escape the suspension');
select lives_ok($$select public.request_my_account_deletion(null)$$, 'a suspended member can still ask for deletion');
select is(public.get_my_account() ->> 'account_state', 'suspended', 'a deletion request keeps the suspension in place');
select is(tests.rows_affected('update public.profiles set bio = ''still here'' where id = auth.uid()'), 0,
  'suspended members cannot edit their profile');
reset role;

select * from finish();
rollback;
