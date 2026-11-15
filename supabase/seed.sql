-- ScoutLink OC demonstration data
--
-- Every record here is FICTIONAL and flagged is_demo = true. None of it is an
-- official GSOC record. Remove it with supabase/scripts/remove-demo-data.sql.
-- No user accounts are created: sign up through the app and bootstrap your own
-- administrator (see docs/DEPLOYMENT.md).
--
-- Years active are stored as a founding year relative to when the seed runs,
-- so the "years active" numbers stay as written in the brief.

insert into public.service_units (id, name, code, region, description, founded_year, founded_year_source, is_demo) values
  ('5e000000-0000-4000-8000-000000000001', 'North OC Service Unit (fictional demo)', 'DEMO-N', 'north',
   'Fictional demonstration service unit for northern Orange County.', null, null, true),
  ('5e000000-0000-4000-8000-000000000002', 'Central OC Service Unit (fictional demo)', 'DEMO-C', 'central',
   'Fictional demonstration service unit for central Orange County.', null, null, true),
  ('5e000000-0000-4000-8000-000000000003', 'South OC Service Unit (fictional demo)', 'DEMO-S', 'south',
   'Fictional demonstration service unit for southern Orange County.', null, null, true)
on conflict (id) do nothing;

insert into public.troops
  (id, number, service_unit_id, introduction, approx_size, size_source, size_as_of, founded_year, founded_year_source, collaboration_status, is_demo)
values
  ('7e000000-0000-4000-8000-000000000101', '101', '5e000000-0000-4000-8000-000000000001',
   'Fictional troop. High school Girl Scouts focused on STEM, service and leadership.',
   14, 'fictional_demo', current_date, extract(year from now())::int - 8, 'fictional_demo', 'open', true),
  ('7e000000-0000-4000-8000-000000000202', '202', '5e000000-0000-4000-8000-000000000002',
   'Fictional troop. Juniors and Cadettes who love the outdoors and are building leadership skills.',
   18, 'fictional_demo', current_date, extract(year from now())::int - 5, 'fictional_demo', 'open', true),
  ('7e000000-0000-4000-8000-000000000303', '303', '5e000000-0000-4000-8000-000000000003',
   'Fictional troop. Brownies exploring arts, nature and community service.',
   12, 'fictional_demo', current_date, extract(year from now())::int - 3, 'fictional_demo', 'limited', true),
  ('7e000000-0000-4000-8000-000000000404', '404', '5e000000-0000-4000-8000-000000000001',
   'Fictional troop. Cadettes and Seniors who plan service trips and travel.',
   22, 'fictional_demo', current_date, extract(year from now())::int - 10, 'fictional_demo', 'open', true)
on conflict (id) do nothing;

insert into public.troop_levels (troop_id, level) values
  ('7e000000-0000-4000-8000-000000000101', 'senior'),
  ('7e000000-0000-4000-8000-000000000101', 'ambassador'),
  ('7e000000-0000-4000-8000-000000000202', 'junior'),
  ('7e000000-0000-4000-8000-000000000202', 'cadette'),
  ('7e000000-0000-4000-8000-000000000303', 'brownie'),
  ('7e000000-0000-4000-8000-000000000404', 'cadette'),
  ('7e000000-0000-4000-8000-000000000404', 'senior')
on conflict do nothing;
