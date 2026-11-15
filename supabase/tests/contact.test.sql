-- Public contact form security tests.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

create schema tests;
grant usage on schema tests to anon, authenticated;
create function tests.login_new_user(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into auth.users (email) values (p_email) returning id into v_id;
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
end;
$$;

set local role anon;
select lives_ok($$select public.submit_contact_message('Dana R.', 'dana@example.org', 'pilot', 'We would like to talk about a pilot in our service unit.', '')$$,
  'visitors can send a contact message');
select throws_ok('select * from public.contact_messages', '42501', 'permission denied for table contact_messages',
  'visitors cannot read contact messages');
select throws_ok($$insert into public.contact_messages (name, email, topic, message) values ('X Y', 'x@y.zz', 'general', 'aaaaaaaaaaaaaaaaaaaaaaaa')$$,
  '42501', 'permission denied for table contact_messages', 'visitors cannot bypass the function and insert directly');
select throws_ok($$select public.submit_contact_message('Dana R.', 'not-an-email', 'pilot', 'We would like to talk about a pilot in our service unit.', '')$$,
  'P0001', 'invalid_email', 'invalid email addresses are rejected');
select throws_ok($$select public.submit_contact_message('Dana R.', 'dana@example.org', 'spam', 'We would like to talk about a pilot in our service unit.', '')$$,
  'P0001', 'invalid_topic', 'unknown topics are rejected');
select lives_ok($$select public.submit_contact_message('Bot', 'bot@example.org', 'general', 'Buy cheap things now at our wonderful store!!', 'http://spam.example')$$,
  'honeypot submissions get no error (so bots learn nothing)');
select lives_ok($$select public.submit_contact_message('Dana R.', 'Dana@Example.org', 'general', 'Second message from the same sender, still fine.', '')$$,
  'a second message from the same sender is allowed');
select lives_ok($$select public.submit_contact_message('Dana R.', 'dana@example.org', 'general', 'Third message from the same sender, still allowed.', '')$$,
  'a third message from the same sender is allowed');
select throws_ok($$select public.submit_contact_message('Dana R.', 'dana@example.org', 'general', 'Fourth message within the hour should be blocked.', '')$$,
  'P0001', 'rate_limited', 'a fourth message within an hour is rate limited');
reset role;

select is((select count(*) from public.contact_messages where email = 'bot@example.org'), 0::bigint, 'honeypot submissions are not stored');

select tests.login_new_user('member@test.local');
set local role authenticated;
select is_empty('select * from public.contact_messages', 'signed-in users who are not admins cannot read contact messages');
reset role;

select * from finish();
rollback;
