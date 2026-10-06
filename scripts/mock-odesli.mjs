// Stand-in for api.song.link for local testing (the real API may be unreachable or rate-limited).
// Run: node scripts/mock-odesli.mjs, then serve functions with ODESLI_BASE_URL=http://host.docker.internal:54399
import http from 'node:http';
const song = (id, title, artist) => ({
  entityUniqueId: `SPOTIFY_SONG::${id}`,
  pageUrl: `https://song.link/s/${id}`,
  entitiesByUniqueId: {
    [`SPOTIFY_SONG::${id}`]: { id, type: 'song', title, artistName: artist, thumbnailUrl: `https://picsum.photos/seed/${id}/200`, apiProvider: 'spotify', platforms: ['spotify'] },
    [`ITUNES_SONG::9${id.length}`]: { id: `9${id.length}`, type: 'song', title, artistName: artist, apiProvider: 'itunes', platforms: ['appleMusic', 'itunes'] },
  },
  linksByPlatform: {
    spotify: { url: `https://open.spotify.com/track/${id}`, entityUniqueId: `SPOTIFY_SONG::${id}` },
    appleMusic: { url: `https://music.apple.com/us/album/_/1?i=9${id.length}`, entityUniqueId: `ITUNES_SONG::9${id.length}` },
    youtube: { url: `https://www.youtube.com/watch?v=${id}`, entityUniqueId: `YOUTUBE_VIDEO::${id}` },
  },
});
let hits = 0;
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/hits') { res.end(String(hits)); return; }
  hits++;
  const link = u.searchParams.get('url') ?? '';
  const id = link.split('/').pop();
  if (link.includes('nope')) { res.writeHead(404); res.end('{}'); return; }
  if (link.includes('down')) { res.writeHead(503); res.end('{}'); return; }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(song(id, id === 'angel' ? 'Angel' : 'Song ' + id, 'Massive Attack')));
}).listen(54399, '0.0.0.0');
console.log('mock odesli on 54399');
