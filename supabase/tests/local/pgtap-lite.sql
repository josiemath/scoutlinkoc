-- Minimal, compatible subset of pgTAP for running supabase/tests/*.sql on plain
-- PostgreSQL. `supabase test db` uses the real pgTAP extension instead; only
-- these functions may be used in the test files: plan, ok, is, throws_ok
-- (4 arguments), lives_ok, is_empty, isnt_empty, finish.

create or replace function extensions.plan(p_count integer)
returns text
language plpgsql
as $$
begin
  create temp table if not exists __tap_state (planned integer, ran integer, failed integer) on commit drop;
  delete from __tap_state;
  insert into __tap_state values (p_count, 0, 0);
  -- Tests switch roles mid-transaction; let every role record results.
  grant all on table __tap_state to public;
  return '1..' || p_count;
end;
$$;

create or replace function extensions.__record(p_ok boolean, p_description text, p_diag text default null)
returns text
language plpgsql
as $$
declare
  v_n integer;
begin
  update __tap_state set ran = ran + 1, failed = failed + (case when p_ok then 0 else 1 end) returning ran into v_n;
  return (case when p_ok then 'ok ' else 'not ok ' end) || v_n || ' - ' || coalesce(p_description, '')
    || case when p_ok or p_diag is null then '' else E'\n#   ' || replace(p_diag, E'\n', E'\n#   ') end;
end;
$$;

create or replace function extensions.ok(p_ok boolean, p_description text default null)
returns text language sql as $$ select extensions.__record(coalesce(p_ok, false), p_description, 'got false or null'); $$;

create or replace function extensions.is(p_have anyelement, p_want anyelement, p_description text default null)
returns text
language sql
as $$
  select extensions.__record(p_have is not distinct from p_want, p_description,
    format('have: %s, want: %s', coalesce(p_have::text, 'NULL'), coalesce(p_want::text, 'NULL')));
$$;

create or replace function extensions.throws_ok(p_sql text, p_errcode char(5), p_errmsg text, p_description text)
returns text
language plpgsql
as $$
begin
  execute p_sql;
  return extensions.__record(false, p_description, 'no exception was raised');
exception when others then
  return extensions.__record(
    sqlstate = p_errcode and (p_errmsg is null or sqlerrm = p_errmsg),
    p_description,
    format('caught: %s %s, wanted: %s %s', sqlstate, sqlerrm, p_errcode, coalesce(p_errmsg, '(any message)')));
end;
$$;

create or replace function extensions.lives_ok(p_sql text, p_description text)
returns text
language plpgsql
as $$
begin
  execute p_sql;
  return extensions.__record(true, p_description);
exception when others then
  return extensions.__record(false, p_description, format('died: %s %s', sqlstate, sqlerrm));
end;
$$;

create or replace function extensions.is_empty(p_sql text, p_description text)
returns text
language plpgsql
as $$
declare
  v_count bigint;
begin
  execute format('select count(*) from (%s) as q', p_sql) into v_count;
  return extensions.__record(v_count = 0, p_description, format('%s rows returned', v_count));
exception when others then
  return extensions.__record(false, p_description, format('died: %s %s', sqlstate, sqlerrm));
end;
$$;

create or replace function extensions.isnt_empty(p_sql text, p_description text)
returns text
language plpgsql
as $$
declare
  v_count bigint;
begin
  execute format('select count(*) from (%s) as q', p_sql) into v_count;
  return extensions.__record(v_count > 0, p_description, 'no rows returned');
exception when others then
  return extensions.__record(false, p_description, format('died: %s %s', sqlstate, sqlerrm));
end;
$$;

create or replace function extensions.finish()
returns setof text
language plpgsql
as $$
declare
  v_state record;
begin
  select * into v_state from __tap_state;
  if v_state.ran <> v_state.planned then
    return next format('not ok - planned %s tests but ran %s', v_state.planned, v_state.ran);
  end if;
  if v_state.failed > 0 then
    return next format('# Looks like you failed %s test(s) of %s', v_state.failed, v_state.ran);
  end if;
end;
$$;

grant execute on all functions in schema extensions to anon, authenticated, service_role;
