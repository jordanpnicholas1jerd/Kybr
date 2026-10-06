// resolve-link: a pasted song link → one service-neutral track row
// (docs/KYBR Build Plan.md §4.1). Cached forever per link. If Odesli is down
// or doesn't know the link, it answers { resolved: false } and the app lets
// the burner name the song by hand.
// No third-party imports: Supabase is reached over its REST API with fetch.
import { normalizeLink, parseOdesli, type OdesliResponse } from '../_shared/odesli.ts';

const ODESLI = Deno.env.get('ODESLI_BASE_URL') ?? 'https://api.song.link/v1-alpha.1';
const ODESLI_KEY = Deno.env.get('ODESLI_API_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const TRACK_COLUMNS = 'id,title,artist,duration_ms,art_url,links';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

/** PostgREST as the service role (bypasses RLS; this function is the catalog's only writer). */
function rest(path: string, init: RequestInit & { prefer?: string } = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
  });
}

/** The signed-in user behind this request, or null. */
async function caller(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: auth } });
  if (!res.ok) return null;
  return (await res.json()).id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  // Signed-in people only. The gateway checks the JWT; this makes sure it's a user.
  if (!(await caller(req))) return json({ error: 'sign in first' }, 401);

  let url: string | null = null;
  try {
    url = normalizeLink(String((await req.json()).url ?? ''));
  } catch {
    // bad body
  }
  if (!url) return json({ resolved: false, reason: 'not_a_link' });

  const cached = await rest(`link_cache?select=track:tracks(${TRACK_COLUMNS})&url=eq.${encodeURIComponent(url)}`);
  const hit = cached.ok ? (await cached.json())[0]?.track : null;
  if (hit) return json({ resolved: true, track: hit });

  let body: OdesliResponse;
  try {
    const q = new URLSearchParams({ url });
    if (ODESLI_KEY) q.set('key', ODESLI_KEY);
    const res = await fetch(`${ODESLI}/links?${q}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 400 || res.status === 404) return json({ resolved: false, reason: 'not_found' });
    if (!res.ok) return json({ resolved: false, reason: 'unavailable' });
    body = await res.json();
  } catch {
    return json({ resolved: false, reason: 'unavailable' });
  }

  const t = parseOdesli(body);
  if (typeof t === 'string') return json({ resolved: false, reason: t });

  const up = await rest(`tracks?on_conflict=odesli_key&select=${TRACK_COLUMNS}`, {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify({
      odesli_key: t.odesliKey,
      title: t.title,
      artist: t.artist,
      art_url: t.artUrl,
      apple_id: t.appleId,
      spotify_id: t.spotifyId,
      youtube_id: t.youtubeId,
      links: t.links,
      resolved_at: new Date().toISOString(),
    }),
  });
  if (!up.ok) return json({ error: 'could not save the track' }, 500);
  const track = (await up.json())[0];

  await rest('link_cache?on_conflict=url', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=minimal',
    body: JSON.stringify({ url, track_id: track.id }),
  });
  return json({ resolved: true, track });
});
