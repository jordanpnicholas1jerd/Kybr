-- Track resolution for BURN (docs/KYBR Build Plan.md §4.1).
-- The resolve-link Edge Function turns a pasted link into one service-neutral
-- track row and caches the link so it's never resolved twice. If a link can't
-- be read, the burner can still name the song and burn the raw link.

alter table tracks
  add column odesli_key text unique,  -- canonical Odesli entity, e.g. ITUNES_SONG::1440857781
  add column art_url    text;         -- cover thumbnail from the music service

-- Every pasted URL we've resolved, so we never ask Odesli twice.
create table link_cache (
  url        text primary key,
  track_id   uuid not null references tracks (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table link_cache enable row level security;  -- no policies: server functions only
revoke all on link_cache from anon, authenticated;

-- A song named by hand when its link couldn't be resolved. Playback falls back
-- to opening the raw link.
create function create_raw_track(p_url text, p_title text, p_artist text) returns tracks
language plpgsql volatile security definer set search_path = public as $$
declare t tracks;
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  if p_url !~* '^https?://\S+$' or char_length(p_url) > 500 then
    raise exception 'not a link' using errcode = '22023';
  end if;
  if char_length(trim(p_title)) not between 1 and 120 or char_length(trim(p_artist)) not between 1 and 120 then
    raise exception 'name the song and the artist' using errcode = '22023';
  end if;
  insert into tracks (title, artist, links)
  values (trim(p_title), trim(p_artist), jsonb_build_object('raw', p_url))
  returning * into t;
  return t;
end $$;

revoke execute on function create_raw_track(text, text, text) from public, anon;
grant execute on function create_raw_track(text, text, text) to authenticated;
