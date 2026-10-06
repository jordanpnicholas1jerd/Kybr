-- Track resolution checks.
\set ON_ERROR_STOP on
\o /dev/null
create function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAIL: %', what; end if;
  raise notice 'ok  %', what;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
set role authenticated;
select pg_temp.ok((select title = 'Untitled Demo' and links->>'raw' = 'https://example.com/x' from create_raw_track('https://example.com/x', ' Untitled Demo ', 'Someone')), 'a member can name a song by hand');
do $$ begin perform create_raw_track('javascript:alert(1)', 'a', 'b'); raise exception 'FAIL: non-link accepted';
exception when invalid_parameter_value then raise notice 'ok  non-links rejected'; end $$;
do $$ begin perform create_raw_track('https://example.com/y', '', 'b'); raise exception 'FAIL: empty title accepted';
exception when invalid_parameter_value then raise notice 'ok  empty title rejected'; end $$;
do $$ begin perform 1 from link_cache; raise exception 'FAIL: link cache readable';
exception when insufficient_privilege then raise notice 'ok  link cache is server-only'; end $$;
do $$ begin insert into tracks (title, artist) values ('x', 'y'); raise exception 'FAIL: client wrote the catalog';
exception when insufficient_privilege then raise notice 'ok  clients cannot write the catalog directly'; end $$;
reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;
do $$ begin perform create_raw_track('https://example.com/z', 'a', 'b'); raise exception 'FAIL: anon made a track';
exception when insufficient_privilege then raise notice 'ok  anon cannot make tracks'; end $$;
reset role;
\o
\echo 'all track checks passed'
