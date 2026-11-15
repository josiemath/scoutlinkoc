#!/usr/bin/env bash
# Runs the database tests against a plain PostgreSQL server (no Docker needed).
#
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres bash supabase/tests/local/run.sh
#
# It creates a throwaway database, applies a Supabase stand-in, every migration
# and the seed, then runs each supabase/tests/*.test.sql file. With the Supabase
# CLI and Docker you can run the same files with `npx supabase test db`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DB="scoutlink_test_$$"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 --no-psqlrc)

cleanup() { "${PSQL[@]}" -d postgres -c "drop database if exists ${DB} with (force)" >/dev/null 2>&1 || true; }
trap cleanup EXIT

"${PSQL[@]}" -d postgres -c "create database ${DB}" >/dev/null
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/local/supabase-shim.sql" >/dev/null
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/local/pgtap-lite.sql" >/dev/null
"${PSQL[@]}" -d "$DB" -c "alter database ${DB} set search_path = \"\$user\", public, extensions" >/dev/null

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$migration")"
  "${PSQL[@]}" -d "$DB" -f "$migration" >/dev/null
done
echo "seed     seed.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/seed.sql" >/dev/null

failed=0
for test in "$ROOT"/supabase/tests/*.test.sql; do
  name="$(basename "$test")"
  # The real pgTAP extension isn't installed locally; pgtap-lite provides the functions.
  output="$(sed '/create extension if not exists pgtap/d' "$test" | "${PSQL[@]}" -d "$DB" -t -A 2>&1)" || { echo "$output"; echo "FAIL     $name (SQL error)"; failed=1; continue; }
  echo "$output" | grep -E '^(ok|not ok|#)' | sed 's/^/         /'
  if echo "$output" | grep -qE '^not ok|Looks like you failed'; then
    echo "FAIL     $name"; failed=1
  else
    echo "PASS     $name ($(echo "$output" | grep -cE '^ok') assertions)"
  fi
done

# The demo-data removal script must leave no fictional records behind, and be safe to run twice.
for run in first second; do
  "${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/scripts/remove-demo-data.sql" >/dev/null
done
left="$("${PSQL[@]}" -d "$DB" -t -A -c "select (select count(*) from public.troops where is_demo) + (select count(*) from public.service_units where is_demo)")"
if [ "$left" = "0" ]; then
  echo "PASS     remove-demo-data.sql (no demo records left after two runs)"
else
  echo "FAIL     remove-demo-data.sql ($left demo records left)"; failed=1
fi

exit $failed
