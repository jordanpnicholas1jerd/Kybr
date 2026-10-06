import { describe, expect, it } from 'vitest';
import { normalizeLink, parseOdesli, type OdesliResponse } from './odesli';

// Shaped like Odesli's documented response for a Spotify track link (not a
// captured one: api.song.link isn't reachable from the build sandbox).
const fromSpotify: OdesliResponse = {
  entityUniqueId: 'SPOTIFY_SONG::67Hna13dNDkZvBpTXRIaOJ',
  pageUrl: 'https://song.link/s/67Hna13dNDkZvBpTXRIaOJ',
  entitiesByUniqueId: {
    'SPOTIFY_SONG::67Hna13dNDkZvBpTXRIaOJ': {
      id: '67Hna13dNDkZvBpTXRIaOJ', type: 'song', title: 'Teardrop', artistName: 'Massive Attack',
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b273', apiProvider: 'spotify', platforms: ['spotify'],
    },
    'ITUNES_SONG::724466660': {
      id: '724466660', type: 'song', title: 'Teardrop', artistName: 'Massive Attack',
      thumbnailUrl: 'https://is1-ssl.mzstatic.com/image/thumb/x.jpg', apiProvider: 'itunes', platforms: ['appleMusic', 'itunes'],
    },
    'YOUTUBE_VIDEO::u7K72X4eo_s': {
      id: 'u7K72X4eo_s', type: 'song', title: 'Massive Attack - Teardrop', artistName: 'MassiveAttackVEVO',
      apiProvider: 'youtube', platforms: ['youtube', 'youtubeMusic'],
    },
  },
  linksByPlatform: {
    spotify: { url: 'https://open.spotify.com/track/67Hna13dNDkZvBpTXRIaOJ', entityUniqueId: 'SPOTIFY_SONG::67Hna13dNDkZvBpTXRIaOJ' },
    appleMusic: { url: 'https://geo.music.apple.com/us/album/_/724466647?i=724466660', entityUniqueId: 'ITUNES_SONG::724466660' },
    itunes: { url: 'https://geo.itunes.apple.com/us/album/_/724466647?i=724466660', entityUniqueId: 'ITUNES_SONG::724466660' },
    youtube: { url: 'https://www.youtube.com/watch?v=u7K72X4eo_s', entityUniqueId: 'YOUTUBE_VIDEO::u7K72X4eo_s' },
    youtubeMusic: { url: 'https://music.youtube.com/watch?v=u7K72X4eo_s', entityUniqueId: 'YOUTUBE_VIDEO::u7K72X4eo_s' },
  },
};

describe('parseOdesli', () => {
  it('builds one service-neutral track', () => {
    const t = parseOdesli(fromSpotify);
    expect(t).toMatchObject({
      title: 'Teardrop', artist: 'Massive Attack',
      appleId: '724466660', spotifyId: '67Hna13dNDkZvBpTXRIaOJ', youtubeId: 'u7K72X4eo_s',
      artUrl: 'https://i.scdn.co/image/ab67616d0000b273',
    });
    if (typeof t === 'string') throw new Error(t);
    expect(t.links.appleMusic).toContain('music.apple.com');
    expect(t.links.spotify).toContain('open.spotify.com');
    expect(t.links.page).toBe('https://song.link/s/67Hna13dNDkZvBpTXRIaOJ');
  });

  it('keys the same song the same way whichever service it came from', () => {
    const fromApple = { ...fromSpotify, entityUniqueId: 'ITUNES_SONG::724466660' };
    const a = parseOdesli(fromSpotify), b = parseOdesli(fromApple);
    if (typeof a === 'string' || typeof b === 'string') throw new Error('parse failed');
    expect(a.odesliKey).toBe('ITUNES_SONG::724466660');
    expect(b.odesliKey).toBe(a.odesliKey);
  });

  it('falls back to the input entity when no priority platform matched', () => {
    const only = {
      entityUniqueId: 'SOUNDCLOUD_SONG::1',
      entitiesByUniqueId: { 'SOUNDCLOUD_SONG::1': { id: '1', type: 'song', title: 'demo', artistName: 'mara', apiProvider: 'soundcloud', platforms: ['soundcloud'] } },
      linksByPlatform: { soundcloud: { url: 'https://soundcloud.com/mara/demo', entityUniqueId: 'SOUNDCLOUD_SONG::1' } },
    };
    const t = parseOdesli(only);
    if (typeof t === 'string') throw new Error(t);
    expect(t.odesliKey).toBe('SOUNDCLOUD_SONG::1');
    expect(t.appleId).toBeNull();
  });

  it('rejects albums', () => {
    const album = { ...fromSpotify, entitiesByUniqueId: { ...fromSpotify.entitiesByUniqueId,
      'SPOTIFY_SONG::67Hna13dNDkZvBpTXRIaOJ': { ...fromSpotify.entitiesByUniqueId['SPOTIFY_SONG::67Hna13dNDkZvBpTXRIaOJ'], type: 'album' } } };
    expect(parseOdesli(album)).toBe('not_a_song');
  });
});

describe('normalizeLink', () => {
  it('strips tracking and fragments', () => {
    expect(normalizeLink(' https://open.spotify.com/track/67Hna?si=abc123 ')).toBe('https://open.spotify.com/track/67Hna');
    expect(normalizeLink('https://music.apple.com/us/album/x/1?i=2&utm_source=share#top')).toBe('https://music.apple.com/us/album/x/1?i=2');
    expect(normalizeLink('http://YouTu.be/abc')).toBe('https://youtu.be/abc');
  });
  it('refuses non-links', () => {
    expect(normalizeLink('teardrop by massive attack')).toBeNull();
    expect(normalizeLink('javascript:alert(1)')).toBeNull();
    expect(normalizeLink('spotify:track:67Hna')).toBeNull();
  });
});
