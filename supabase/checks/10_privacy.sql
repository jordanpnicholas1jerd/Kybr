-- Privacy and crew-rule checks. Each block raises (and the run stops) on failure.
\set ON_ERROR_STOP on
\o /dev/null

-- Act as a user: '' for anon.
create function pg_temp.as_user(u text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u, false);
  if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;
create function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAIL: %', what; end if;
  raise notice 'ok  %', what;
end $$;

-- ten people
insert into auth.users select ('00000000-0000-0000-0000-00000000000' || to_hex(i))::uuid from generate_series(1, 10) i;
insert into profiles (id, handle, display_name)
  select id, 'user_' || right(id::text, 1), 'User ' || right(id::text, 1) from auth.users;
insert into tracks (id, title, artist) values ('11111111-1111-1111-1111-111111111111', 'Teardrop', 'Massive Attack');
update profiles set profile_track_id = '11111111-1111-1111-1111-111111111111' where handle = 'user_1';

-- user 1 starts a crew
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
create temp table t_crew on commit preserve rows as select (crew).id as crew_id, (dub).code as code from create_crew('Basement');
reset role;
grant select on t_crew to anon, authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) = 1 from crews where name = 'basement'), 'creator sees their new crew');
select pg_temp.ok((select freq ~ '^\d{2,3}\.[13579]$' from crews limit 1), 'crew gets an FM frequency');
insert into burns (crew_id, track_id, from_user, note, heat)
  select crew_id, '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'basement anthem', 4.5 from t_crew;
select pg_temp.ok((select count(*) = 1 from this_week), 'burn shows in this week');

-- heat must be in half steps
do $$ begin
  insert into burns (crew_id, track_id, from_user, heat)
    select crew_id, '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 4.3 from t_crew;
  raise exception 'FAIL: heat 4.3 accepted';
exception when check_violation then raise notice 'ok  heat 4.3 rejected';
end $$;

-- outsider (user 9) sees nothing private, but sees public DECK data
select pg_temp.as_user('00000000-0000-0000-0000-000000000009');
select pg_temp.ok((select count(*) = 0 from crews), 'outsider sees no crews');
select pg_temp.ok((select count(*) = 0 from crew_members), 'outsider sees no members');
select pg_temp.ok((select count(*) = 0 from burns), 'outsider sees no burns');
select pg_temp.ok((select count(*) = 0 from this_week), 'outsider sees no this week');
select pg_temp.ok((select count(*) = 0 from dubs), 'outsider sees no dubs');
select pg_temp.ok((select count(*) = 10 from profiles), 'profiles are public');
do $$ begin
  insert into burns (crew_id, track_id, from_user) select crew_id, '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000009' from t_crew;
  raise exception 'FAIL: outsider burned into a crew';
exception when insufficient_privilege then raise notice 'ok  outsider cannot burn into a crew';
end $$;

-- anon: public DECK yes, private side no
select pg_temp.as_user('');
select pg_temp.ok((select count(*) = 10 from profiles), 'anon can read DECK profiles');
select pg_temp.ok((select profile_track_id is not null from profiles where handle = 'user_1'), 'anon can read profile song');
select pg_temp.ok((select count(*) = 1 from tracks), 'anon can read the catalog');
do $$ begin perform 1 from burns; raise exception 'FAIL: anon read burns';
exception when insufficient_privilege then raise notice 'ok  anon cannot read burns'; end $$;
do $$ begin perform 1 from settings; raise exception 'FAIL: anon read settings';
exception when insufficient_privilege then raise notice 'ok  anon cannot read settings'; end $$;
do $$ begin perform redeem_dub('AAAAAA'); raise exception 'FAIL: anon redeemed a dub';
exception when insufficient_privilege then raise notice 'ok  anon cannot redeem dubs'; end $$;

-- settings are owner only
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
insert into settings (user_id, skin, preferred_service) values ('00000000-0000-0000-0000-000000000001', 'mint', 'apple');
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.ok((select count(*) = 0 from settings), 'others cannot read your settings');

-- DUBs: user 2 redeems the first one; it can't be reused
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.ok((select name = 'basement' from redeem_dub((select lower(code) from t_crew))), 'dub redeems (case-insensitive)');
select pg_temp.ok((select count(*) = 1 from burns), 'new member sees crew burns');
select pg_temp.ok((select count(*) = 2 from crew_members), 'new member sees the crew');
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
do $$ begin perform redeem_dub((select code from t_crew)); raise exception 'FAIL: used dub accepted';
exception when raise_exception then
  if sqlerrm <> 'dub already used' then raise; end if; raise notice 'ok  used dub rejected'; end $$;
do $$ begin perform redeem_dub('ZZZZZZ'); raise exception 'FAIL: unknown dub accepted';
exception when raise_exception then
  if sqlerrm <> 'no such dub' then raise; end if; raise notice 'ok  unknown dub rejected'; end $$;
do $$ begin perform create_dub((select crew_id from t_crew)); raise exception 'FAIL: outsider minted a dub';
exception when insufficient_privilege then raise notice 'ok  outsider cannot mint a dub'; end $$;

-- expired dub
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
create temp table t_old on commit preserve rows as select (create_dub(crew_id)).code from t_crew;
reset role;
grant select on t_old to anon, authenticated;
update dubs set expires_at = now() - interval '1 minute' where code = (select code from t_old);
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
do $$ begin perform redeem_dub((select code from t_old)); raise exception 'FAIL: expired dub accepted';
exception when raise_exception then
  if sqlerrm <> 'dub expired' then raise; end if; raise notice 'ok  expired dub rejected'; end $$;

-- fill to 8, then the 9th is turned away
do $$ declare i int; c text; begin
  for i in 3..8 loop
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
    c := (select (create_dub(crew_id)).code from t_crew);
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || to_hex(i), false);
    perform redeem_dub(c);
  end loop;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) = 8 from crew_members), 'crew holds 8');
create temp table t_ninth on commit preserve rows as select (create_dub(crew_id)).code from t_crew;
reset role;
grant select on t_ninth to anon, authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000009');
do $$ begin perform redeem_dub((select code from t_ninth)); raise exception 'FAIL: 9th member joined';
exception when raise_exception then
  if sqlerrm <> 'crew is full' then raise; end if; raise notice 'ok  9th member rejected'; end $$;
select pg_temp.ok((select used_by is null from dubs where code = (select code from t_ninth)) is null, 'outsider still cannot see dubs');
reset role;
select pg_temp.ok((select used_by is null from dubs where code = (select code from t_ninth)), 'failed join does not use up the dub');

-- etch + keep
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
insert into etches (burn_id, user_id, heat, note) select id, '00000000-0000-0000-0000-000000000002', 4, 'heavier than i remembered' from burns;
insert into kept (user_id, burn_id) select '00000000-0000-0000-0000-000000000002', id from burns;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) = 1 from etches), 'crew sees the etch');
select pg_temp.ok((select count(*) = 0 from kept), 'others cannot see your case');
select pg_temp.as_user('00000000-0000-0000-0000-000000000009');
select pg_temp.ok((select count(*) = 0 from etches), 'outsider sees no etches');
do $$ begin
  insert into kept (user_id, burn_id) select '00000000-0000-0000-0000-000000000009', id from burns;
  -- burns are invisible to user 9, so the select yields nothing; try a direct id instead
  reset role;
  perform set_config('kybr.burn', (select id::text from burns limit 1), false);
  set role authenticated;
  insert into kept (user_id, burn_id) values ('00000000-0000-0000-0000-000000000009', current_setting('kybr.burn')::uuid);
  raise exception 'FAIL: outsider kept a burn they cannot see';
exception when insufficient_privilege then raise notice 'ok  outsider cannot keep a crew burn';
end $$;

reset role;
\o
\echo 'all privacy checks passed'
