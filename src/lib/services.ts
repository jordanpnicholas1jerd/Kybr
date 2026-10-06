import type { Service, Track } from '../data';

// Phase 1 plays nothing inside KYBR: every song opens in the listener's own
// music app (docs/KYBR Build Plan.md §4.7).

export const SERVICE_NAMES: Record<Service, string> = {
  apple: 'Apple Music',
  youtube: 'YouTube',
  spotify: 'Spotify',
  link: 'whatever the link opens',
};

/** Odesli platform keys for each service, best first. */
const PLATFORMS: Record<Exclude<Service, 'link'>, string[]> = {
  apple: ['appleMusic', 'itunes'],
  youtube: ['youtubeMusic', 'youtube'],
  spotify: ['spotify'],
};

const OTHER_NAMES: Record<string, string> = {
  tidal: 'Tidal', deezer: 'Deezer', amazonMusic: 'Amazon Music', soundcloud: 'SoundCloud',
  pandora: 'Pandora', napster: 'Napster', audiomack: 'Audiomack', anghami: 'Anghami', boomplay: 'Boomplay',
  bandcamp: 'Bandcamp', audius: 'Audius', page: 'song.link', raw: 'the original link',
};

export interface OpenTarget {
  label: string; // 'Apple Music'
  url: string;
}

/** Where the main "open" key goes for this listener. */
export function primaryTarget(track: Track, preferred: Service): OpenTarget | null {
  if (preferred !== 'link') {
    const url = PLATFORMS[preferred].map((p) => track.links[p]).find(Boolean);
    if (url) return { label: SERVICE_NAMES[preferred], url };
  }
  // No preference (or the song isn't on it): the song.link page lists every service.
  if (track.links.page) return { label: 'song.link', url: track.links.page };
  if (track.links.raw) return { label: 'the original link', url: track.links.raw };
  const any = allTargets(track)[0];
  return any ?? null;
}

/** Every service this song is on, for the "open in…" row. */
export function allTargets(track: Track): OpenTarget[] {
  const out: OpenTarget[] = [];
  for (const s of ['apple', 'spotify', 'youtube'] as const) {
    const url = PLATFORMS[s].map((p) => track.links[p]).find(Boolean);
    if (url) out.push({ label: SERVICE_NAMES[s], url });
  }
  for (const [k, url] of Object.entries(track.links)) {
    if (OTHER_NAMES[k] && !out.some((o) => o.url === url)) out.push({ label: OTHER_NAMES[k], url });
  }
  return out;
}
