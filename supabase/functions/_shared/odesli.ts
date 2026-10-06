// Turns an Odesli (song.link) response into one service-neutral track.
// Pure: no Deno or Node APIs, so the Edge Function and the unit tests share it.
// Response shape: see the API docs linked from https://odesli.co

export interface OdesliEntity {
  id: string;
  type: string; // 'song' | 'album'
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
  apiProvider: string;
  platforms: string[];
}

export interface OdesliResponse {
  entityUniqueId: string;
  pageUrl?: string;
  entitiesByUniqueId: Record<string, OdesliEntity>;
  linksByPlatform: Record<string, { url: string; entityUniqueId: string }>;
}

export interface ResolvedTrack {
  odesliKey: string;
  title: string;
  artist: string;
  artUrl: string | null;
  appleId: string | null;
  spotifyId: string | null;
  youtubeId: string | null;
  /** platform → url, plus 'page' for the song.link page */
  links: Record<string, string>;
}

// The same song pasted from Spotify or Apple Music should land on one row, so
// the key is the entity of the first of these platforms Odesli knows.
const KEY_PRIORITY = ['appleMusic', 'itunes', 'spotify', 'youtubeMusic', 'youtube', 'tidal', 'deezer', 'amazonMusic'];

export type ParseFailure = 'not_a_song';

export function parseOdesli(r: OdesliResponse): ResolvedTrack | ParseFailure {
  const input = r.entitiesByUniqueId[r.entityUniqueId];
  if (!input || input.type !== 'song') return 'not_a_song';

  const entityFor = (platform: string) => {
    const link = r.linksByPlatform[platform];
    return link ? r.entitiesByUniqueId[link.entityUniqueId] : undefined;
  };
  // Some platforms return thin entities; take title/artist from the best one.
  const named = [input, ...KEY_PRIORITY.map(entityFor)].find((e) => e?.title && e?.artistName) ?? input;

  const keyPlatform = KEY_PRIORITY.find((p) => r.linksByPlatform[p]);
  const odesliKey = keyPlatform ? r.linksByPlatform[keyPlatform].entityUniqueId : r.entityUniqueId;

  const links: Record<string, string> = {};
  for (const [platform, link] of Object.entries(r.linksByPlatform)) links[platform] = link.url;
  if (r.pageUrl) links.page = r.pageUrl;

  return {
    odesliKey,
    title: (named.title ?? '').trim() || 'untitled',
    artist: (named.artistName ?? '').trim() || 'unknown artist',
    artUrl: named.thumbnailUrl ?? entityFor('appleMusic')?.thumbnailUrl ?? entityFor('spotify')?.thumbnailUrl ?? null,
    appleId: (entityFor('appleMusic') ?? entityFor('itunes'))?.id ?? null,
    spotifyId: entityFor('spotify')?.id ?? null,
    youtubeId: (entityFor('youtube') ?? entityFor('youtubeMusic'))?.id ?? null,
    links,
  };
}

const TRACKING_PARAMS = /^(si|utm_\w+|fbclid|gclid|feature|context|nd|ls|app)$/i;

/**
 * The cache key for a pasted link: https only, lowercase host, no tracking
 * params or fragment. Returns null for anything that isn't a web link.
 */
export function normalizeLink(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (!u.hostname.includes('.') || raw.length > 500) return null;
  u.protocol = 'https:';
  u.hostname = u.hostname.toLowerCase();
  u.hash = '';
  for (const k of [...u.searchParams.keys()]) if (TRACKING_PARAMS.test(k)) u.searchParams.delete(k);
  return u.toString();
}
