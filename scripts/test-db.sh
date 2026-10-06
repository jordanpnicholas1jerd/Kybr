#!/usr/bin/env bash
# Applies supabase/migrations to a throwaway local Postgres (with a tiny stand-in
# for Supabase's auth schema) and runs the privacy checks in supabase/checks.
# Needs Postgres 15+ binaries (initdb, pg_ctl, psql) on PATH or in PG_BIN.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -n "$PG_BIN" ] && export PATH="$PG_BIN:$PATH"
tmp="$(mktemp -d)"
port="${PGPORT_TEST:-54329}"
run() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$tmp"
cleanup() { run pg_ctl -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
run initdb -D "$tmp/data" -A trust -U postgres >/dev/null
run pg_ctl -D "$tmp/data" -o "-p $port -k $tmp -c listen_addresses=''" -l "$tmp/log" start >/dev/null
psql_() { psql -h "$tmp" -p "$port" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }
psql_ -f "$root/supabase/checks/00_auth_stub.sql"
for f in "$root"/supabase/migrations/*.sql; do psql_ -f "$f"; done
for f in "$root"/supabase/checks/[1-9]*.sql; do psql_ -f "$f"; done
