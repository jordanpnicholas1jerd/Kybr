-- KYBR Phase 1 schema: profiles, crews, DUB invites, tracks, burns, etches, CASE.
-- Albums, reviews and Top 8 are created now so the public DECK has its tables,
-- but they are only filled in Phase 2. Live rooms (room_state) wait for Phase 4.
--
-- Privacy (docs/KYBR Build Plan.md §7, spec §8 Settled 10):
--   public    profiles, top8, reviews, tracks, albums, album_tracks
--   owner     settings, kept
--   crew only crews, crew_members, dubs, burns, etches, this_week
-- Anti-clout: nothing here returns counts of plays, likes, followers or reviews.

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- Heat is 0.5–5 in half steps (spec §4.5).
create domain heat as numeric(2,1)
  check (value between 0.5 and 5 and value * 2 = trunc(value * 2));

-- ---------------------------------------------------------------------------
-- people
-- ---------------------------------------------------------------------------

-- Public DECK fields only. Never add crew, burn or CASE data here.
create table profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  handle           text not null unique
                   check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name     text not null check (char_length(display_name) between 1 and 40),
  tagline          text check (char_length(tagline) <= 80),
  liner_notes      text check (char_length(liner_notes) <= 600),
  profile_track_id uuid,  -- fk added after tracks
  created_at       timestamptz not null default now()
);

-- Private per-user settings, kept apart from the public profile row.
create table settings (
  user_id           uuid primary key references profiles (id) on delete cascade,
  skin              text not null default 'uv'
                    check (skin in ('uv', 'sunset', 'ice', 'volt', 'heat', 'mint')),
  preferred_service text not null default 'link'
                    check (preferred_service in ('apple', 'youtube', 'spotify', 'link'))
);

-- ---------------------------------------------------------------------------
-- catalog (written by server functions only)
-- ---------------------------------------------------------------------------

create table albums (
  id             uuid primary key default gen_random_uuid(),
  mbid           uuid unique,
  apple_album_id text,
  title          text not null,
  artist         text not null,
  year           int,
  cover_url      text,
  tint           text,
  source         text not null default 'musicbrainz' check (source in ('musicbrainz', 'apple'))
);

create table tracks (
  id          uuid primary key default gen_random_uuid(),
  isrc        text unique,
  title       text not null,
  artist      text not null,
  duration_ms int check (duration_ms > 0),
  album_id    uuid references albums (id) on delete set null,
  apple_id    text,
  spotify_id  text,
  youtube_id  text,
  links       jsonb not null default '{}'::jsonb,  -- { "appleMusic": url, "spotify": url, ... } or { "raw": url }
  resolved_at timestamptz
);

alter table profiles
  add constraint profiles_profile_track_fk
  foreign key (profile_track_id) references tracks (id) on delete set null;

create table album_tracks (
  album_id uuid not null references albums (id) on delete cascade,
  position int  not null check (position > 0),
  side     text not null check (side in ('A', 'B')),
  title    text not null,
  track_id uuid references tracks (id) on delete set null,
  primary key (album_id, position)
);

-- ---------------------------------------------------------------------------
-- crews
-- ---------------------------------------------------------------------------

create table crews (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (name ~ '^[a-z0-9 ._-]{1,24}$'),
  freq       text not null check (freq ~ '^(8[89]|9[0-9]|10[0-7])\.[13579]$'),
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table crew_members (
  crew_id   uuid not null references crews (id) on delete cascade,
  user_id   uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);
create index crew_members_user_idx on crew_members (user_id);

-- CHNL cap: 8 people (spec §8 Settled 4). Locks the crew row so two
-- simultaneous joins can't both squeeze in as the 8th member.
create function enforce_crew_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from crews where id = new.crew_id for update;
  if (select count(*) from crew_members where crew_id = new.crew_id) >= 8 then
    raise exception 'crew is full' using errcode = 'P0001', hint = 'crew_full';
  end if;
  return new;
end $$;

create trigger crew_members_cap
  before insert on crew_members
  for each row execute function enforce_crew_cap();

-- DUB = invite. Single use, expires after 7 days.
create table dubs (
  code       text primary key check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  crew_id    uuid not null references crews (id) on delete cascade,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by    uuid references profiles (id),
  used_at    timestamptz
);
create index dubs_crew_idx on dubs (crew_id);

-- Membership check used by every crew policy. security definer so policies on
-- crew_members can call it without recursing into themselves.
create function is_crew_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from crew_members where crew_id = c and user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- burns, etches, CASE
-- ---------------------------------------------------------------------------

create table burns (
  id         uuid primary key default gen_random_uuid(),
  crew_id    uuid not null references crews (id) on delete cascade,
  track_id   uuid not null references tracks (id),
  from_user  uuid not null references profiles (id) on delete cascade,
  note       text check (char_length(note) <= 80),
  heat       heat,
  created_at timestamptz not null default now()
);
create index burns_crew_created_idx on burns (crew_id, created_at desc);

create table etches (
  burn_id    uuid not null references burns (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  heat       heat not null,
  note       text check (char_length(note) <= 80),
  created_at timestamptz not null default now(),
  primary key (burn_id, user_id)
);

create table kept (
  user_id uuid not null references profiles (id) on delete cascade,
  burn_id uuid not null references burns (id) on delete cascade,
  kept_at timestamptz not null default now(),
  primary key (user_id, burn_id)
);

-- This Week: a crew's burns from the last 7 days, oldest first.
-- security_invoker makes the view obey the burns policies of whoever reads it.
create view this_week with (security_invoker = true) as
  select * from burns
  where created_at > now() - interval '7 days'
  order by created_at asc;

-- ---------------------------------------------------------------------------
-- public DECK: reviews and Top 8 (filled in Phase 2)
-- ---------------------------------------------------------------------------

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references albums (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  heat       heat not null,
  body       text check (char_length(body) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (album_id, user_id)
);

create table top8 (
  user_id  uuid not null references profiles (id) on delete cascade,
  position int  not null check (position between 1 and 8),
  album_id uuid not null references albums (id) on delete cascade,
  primary key (user_id, position),
  unique (user_id, album_id)
);

-- ---------------------------------------------------------------------------
-- crew actions (the only way to create crews, join them or mint DUBs)
-- ---------------------------------------------------------------------------

create function new_dub_code() returns text
language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no 0/O, 1/I
  result text := '';
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end $$;

-- Mint a DUB for a crew you're in.
create function create_dub(p_crew_id uuid) returns dubs
language plpgsql volatile security definer set search_path = public as $$
declare d dubs;
begin
  if auth.uid() is null or not is_crew_member(p_crew_id) then
    raise exception 'not in this crew' using errcode = '42501';
  end if;
  loop
    begin
      insert into dubs (code, crew_id, created_by)
      values (new_dub_code(), p_crew_id, auth.uid())
      returning * into d;
      return d;
    exception when unique_violation then
      -- code collision: roll again
    end;
  end loop;
end $$;

-- Start a crew: you become its first member and get a DUB to share.
create function create_crew(p_name text) returns table (crew crews, dub dubs)
language plpgsql volatile security definer set search_path = public as $$
declare
  c crews;
  f text;
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  -- A frequency on the FM dial (88.1–107.9, odd tenths), unused by your other crews.
  loop
    f := (88 + floor(random() * 20))::int || '.' || (1 + 2 * floor(random() * 5))::int;
    exit when not exists (
      select 1 from crews x join crew_members m on m.crew_id = x.id
      where m.user_id = auth.uid() and x.freq = f);
  end loop;
  insert into crews (name, freq, created_by)
  values (lower(trim(p_name)), f, auth.uid())
  returning * into c;
  insert into crew_members (crew_id, user_id) values (c.id, auth.uid());
  crew := c;
  dub := create_dub(c.id);
  return next;
end $$;

-- Redeem a DUB. Errors carry a hint the app turns into LCD copy:
-- dub_unknown, dub_used, dub_expired, crew_full.
create function redeem_dub(p_code text) returns crews
language plpgsql volatile security definer set search_path = public as $$
declare
  d dubs;
  c crews;
  v_code text := upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  select * into d from dubs where dubs.code = v_code for update;
  if not found then
    raise exception 'no such dub' using errcode = 'P0001', hint = 'dub_unknown';
  end if;
  select * into c from crews where id = d.crew_id;
  if exists (select 1 from crew_members where crew_id = d.crew_id and user_id = auth.uid()) then
    return c;  -- already in: redeeming again is harmless and doesn't burn the DUB
  end if;
  if d.used_by is not null then
    raise exception 'dub already used' using errcode = 'P0001', hint = 'dub_used';
  end if;
  if d.expires_at < now() then
    raise exception 'dub expired' using errcode = 'P0001', hint = 'dub_expired';
  end if;
  insert into crew_members (crew_id, user_id) values (d.crew_id, auth.uid());  -- cap trigger
  update dubs set used_by = auth.uid(), used_at = now() where dubs.code = d.code;
  return c;
end $$;

revoke execute on function new_dub_code() from public;
revoke execute on function enforce_crew_cap() from public;
revoke execute on function create_dub(uuid), create_crew(text), redeem_dub(text) from public, anon;
grant execute on function create_dub(uuid), create_crew(text), redeem_dub(text) to authenticated;

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------

alter table profiles     enable row level security;
alter table settings     enable row level security;
alter table albums       enable row level security;
alter table tracks       enable row level security;
alter table album_tracks enable row level security;
alter table crews        enable row level security;
alter table crew_members enable row level security;
alter table dubs         enable row level security;
alter table burns        enable row level security;
alter table etches       enable row level security;
alter table kept         enable row level security;
alter table reviews      enable row level security;
alter table top8         enable row level security;

-- public DECK
create policy "decks are public"        on profiles for select using (true);
create policy "make your own profile"   on profiles for insert to authenticated with check (id = auth.uid());
create policy "edit your own profile"   on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "top 8 is public"         on top8 for select using (true);
create policy "edit your own top 8"     on top8 for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reviews are public"      on reviews for select using (true);
create policy "write your own reviews"  on reviews for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- catalog: readable by all, written only by server functions (service role bypasses RLS)
create policy "catalog is public" on albums       for select using (true);
create policy "catalog is public" on tracks       for select using (true);
create policy "catalog is public" on album_tracks for select using (true);

-- owner only
create policy "your settings"     on settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- crew only. Crews, memberships and DUBs are created through the functions above.
create policy "members see their crew"   on crews        for select to authenticated using (is_crew_member(id));
create policy "members see each other"   on crew_members for select to authenticated using (is_crew_member(crew_id));
create policy "leave a crew"             on crew_members for delete to authenticated using (user_id = auth.uid());
create policy "members see crew dubs"    on dubs         for select to authenticated using (is_crew_member(crew_id));

create policy "members see crew burns"   on burns for select to authenticated using (is_crew_member(crew_id));
create policy "burn as yourself"         on burns for insert to authenticated
  with check (from_user = auth.uid() and is_crew_member(crew_id));
create policy "unburn your own"          on burns for delete to authenticated using (from_user = auth.uid());

create policy "members see crew etches"  on etches for select to authenticated
  using (exists (select 1 from burns b where b.id = burn_id and is_crew_member(b.crew_id)));
create policy "etch as yourself"         on etches for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from burns b where b.id = burn_id and is_crew_member(b.crew_id)));
create policy "re-etch your own"         on etches for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "scratch your own etch"    on etches for delete to authenticated using (user_id = auth.uid());

create policy "your case"                on kept for select to authenticated using (user_id = auth.uid());
create policy "keep a burn you can see"  on kept for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from burns b where b.id = burn_id and is_crew_member(b.crew_id)));
create policy "take it out of your case" on kept for delete to authenticated using (user_id = auth.uid());

-- Table privileges. Supabase grants broadly by default; RLS above does the real gating,
-- but anon gets nothing it doesn't need.
revoke all on settings, crews, crew_members, dubs, burns, etches, kept from anon;
revoke all on this_week from anon;
grant select on this_week to authenticated;
