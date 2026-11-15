-- Removes every fictional demonstration record (is_demo = true) and anything
-- that points at one, without touching real records. Run in the Supabase SQL
-- editor. Safe to run more than once.

begin;

-- Role assignments scoped to demo troops or service units.
update public.role_assignments set revoked_at = now()
where revoked_at is null and (
  (scope_type = 'troop' and scope_id in (select id from public.troops where is_demo))
  or (scope_type = 'service_unit' and scope_id in (select id from public.service_units where is_demo))
);

-- Requests and affiliations that reference demo organizations.
delete from public.troop_affiliations where troop_id in (select id from public.troops where is_demo);
delete from public.service_unit_affiliations where service_unit_id in (select id from public.service_units where is_demo);
delete from public.verification_requests
where troop_id in (select id from public.troops where is_demo)
   or service_unit_id in (select id from public.service_units where is_demo);

delete from public.troops where is_demo;
delete from public.service_units where is_demo and id not in (select service_unit_id from public.troops);

insert into public.audit_logs (actor_id, action, target_type, metadata)
values (null, 'demo_data.removed', 'database', '{}'::jsonb);

commit;
