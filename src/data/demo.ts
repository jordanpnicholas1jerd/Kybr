import { DEFAULT_SKIN } from '../theme/skins';
import {
  DUB_ALPHABET, DubError, HandleTakenError, normalizeDub,
  type Burn, type Crew, type CrewDeck, type Dub, type Etch, type KeptDisc, type KybrApi,
  type Person, type Profile, type Resolved, type Session, type Settings, type Track,
} from './types';

// Demo mode: the prototype's fake data, kept in memory. Nothing is saved.
// `?demo` starts at the answering machine; `?demo=crew` starts already in the
// prototype's three crews.

const DAY = 864e5;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 36e5).toISOString();

const YOU: Person = { id: 'demo-you', displayName: 'you' };
const p = (name: string): Person => ({ id: `demo-${name.toLowerCase()}`, displayName: name });

/** Search links on each service, so "open in…" goes somewhere real. */
function demoTrack(title: string, artist: string, durSec: number): Track {
  const q = encodeURIComponent(`${title} ${artist}`);
  return {
    id: `demo-t-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title, artist, durationMs: durSec * 1000, artUrl: null,
    links: {
      appleMusic: `https://music.apple.com/us/search?term=${q}`,
      spotify: `https://open.spotify.com/search/${q}`,
      youtube: `https://www.youtube.com/results?search_query=${q}`,
    },
  };
}

interface DemoCrew extends Crew { members: Person[]; full?: boolean }

const CREWS: DemoCrew[] = [
  { id: 'demo-family', name: 'family', freq: '92.1', members: ['Mom', 'Dad', 'Liv', 'Sam'].map(p) },
  { id: 'demo-basement', name: 'basement', freq: '98.6', members: ['Mara', 'Dev', 'Sof', 'June', 'Rae', 'Kit', 'Tam'].map(p) },
  { id: 'demo-roadtrip', name: 'roadtrip', freq: '104.3', members: ['Al', 'Bo', 'Cy', 'Di', 'Ed', 'Fi'].map(p) },
  { id: 'demo-full', name: 'full house', freq: '101.1', members: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(p), full: true },
];

const seedBurn = (id: string, crewId: string, title: string, artist: string, dur: number, who: string, at: string, note: string | null = null, heat: number | null = null): Burn => ({
  id, crewId, crewName: CREWS.find((c) => c.id === crewId)!.name,
  track: demoTrack(title, artist, dur), from: p(who), note, heat, createdAt: at,
});

const SEED_BURNS: Burn[] = [
  seedBurn('b1', 'demo-basement', 'Teardrop', 'Massive Attack', 279, 'Mara', ago(0, 3), 'put this on when the lights go off', 4.5),
  seedBurn('b2', 'demo-basement', 'Hyperballad', 'Björk', 321, 'Dev', ago(1, 2)),
  seedBurn('b3', 'demo-basement', 'Glory Box', 'Portishead', 306, 'Sof', ago(2, 5), 'the last song, every time', 5),
  seedBurn('b4', 'demo-basement', 'How Does It Feel', "D'Angelo", 329, 'June', ago(4)),
  seedBurn('b5', 'demo-basement', 'Crystalised', 'The xx', 203, 'Mara', ago(9)),
  seedBurn('b6', 'demo-family', 'Dreams', 'Fleetwood Mac', 254, 'Mom', ago(0, 8), 'kitchen song'),
  seedBurn('b7', 'demo-family', 'Africa', 'Toto', 295, 'Dad', ago(3)),
  seedBurn('b8', 'demo-family', 'Linger', 'The Cranberries', 274, 'Liv', ago(12)),
  seedBurn('b9', 'demo-roadtrip', 'Mr. Brightside', 'The Killers', 222, 'Al', ago(1, 9)),
  seedBurn('b10', 'demo-roadtrip', 'Float On', 'Modest Mouse', 208, 'Cy', ago(5)),
  seedBurn('b11', 'demo-roadtrip', '1979', 'Smashing Pumpkins', 266, 'Bo', ago(8)),
];

const SEED_ETCHES: Etch[] = [
  { burnId: 'b1', by: p('Dev'), heat: 4, note: 'basement anthem, no notes', createdAt: ago(0, 1) },
  { burnId: 'b2', by: p('Mara'), heat: 4.5, note: 'the cliff part!!', createdAt: ago(1) },
  { burnId: 'b3', by: p('Mara'), heat: 5, note: 'this is the one', createdAt: ago(2) },
  { burnId: 'b5', by: p('Sof'), heat: 3.5, note: 'quiet in a loud way', createdAt: ago(8) },
  { burnId: 'b6', by: p('Dad'), heat: 4.5, note: 'your mother loves this one', createdAt: ago(0, 6) },
];

/** DUBs that work in demo mode. Shown on screen as a hint. */
export const DEMO_DUBS: Record<string, { crewId: string; state?: 'used' | 'expired' }> = {
  BSM986: { crewId: 'demo-basement' },
  FAM921: { crewId: 'demo-family' },
  RDT743: { crewId: 'demo-roadtrip' },
  FUL888: { crewId: 'demo-full' },
  USD222: { crewId: 'demo-basement', state: 'used' },
  EXP777: { crewId: 'demo-basement', state: 'expired' },
};

/** What BURN's "paste a link" resolves to in demo mode. */
const PICKS: Track[] = [
  demoTrack('Angel', 'Massive Attack', 379),
  demoTrack('Pagan Poetry', 'Björk', 314),
  demoTrack('Sour Times', 'Portishead', 251),
  demoTrack('Digital Love', 'Daft Punk', 301),
];

const wait = (ms = 380) => new Promise((r) => setTimeout(r, ms));

function randomCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += DUB_ALPHABET[Math.floor(Math.random() * DUB_ALPHABET.length)];
  return s;
}

function randomFreq(taken: string[]): string {
  for (;;) {
    const f = `${88 + Math.floor(Math.random() * 20)}.${1 + 2 * Math.floor(Math.random() * 5)}`;
    if (!taken.includes(f)) return f;
  }
}

const plain = ({ id, name, freq }: Crew): Crew => ({ id, name, freq });

export function createDemoApi(startInCrews = false): KybrApi {
  const session: Session = { userId: YOU.id, email: 'you@demo.kybr' };
  let profile: Profile | null = { id: YOU.id, handle: 'you', displayName: 'you' };
  let settings: Settings = { skin: DEFAULT_SKIN, preferredService: 'link' };
  const crews: DemoCrew[] = CREWS.map((c) => ({ ...c, members: [...c.members] }));
  const joined = new Set<string>(startInCrews ? ['demo-family', 'demo-basement', 'demo-roadtrip'] : []);
  const burns: Burn[] = [...SEED_BURNS];
  const etches: Etch[] = [...SEED_ETCHES];
  const kept: { burnId: string; keptAt: string }[] = startInCrews
    ? [{ burnId: 'b1', keptAt: ago(0, 2) }, { burnId: 'b3', keptAt: ago(2) }, { burnId: 'b2', keptAt: ago(4) }, { burnId: 'b6', keptAt: ago(5) }]
    : [];

  const mine = (b: Burn) => joined.has(b.crewId);
  const join = (c: DemoCrew) => {
    joined.add(c.id);
    if (!c.members.some((m) => m.id === YOU.id)) c.members.push(YOU);
  };
  if (startInCrews) crews.filter((c) => joined.has(c.id)).forEach(join);

  return {
    mode: 'demo',
    async session() { return session; },
    onSessionChange() { return () => {}; },
    async sendMagicLink() { await wait(); },
    async signOut() { joined.clear(); },

    async me() { return profile; },
    async createProfile(handle, displayName) {
      await wait();
      if (['mara', 'dev', 'sof'].includes(handle)) throw new HandleTakenError();
      profile = { id: session.userId, handle, displayName };
      return profile;
    },
    async settings() { return settings; },
    async saveSettings(patch) { settings = { ...settings, ...patch }; },

    async myCrews() { return crews.filter((c) => joined.has(c.id)).map(plain); },
    async createCrew(name) {
      await wait(700);
      const crew: DemoCrew = { id: `demo-${Date.now()}`, name: name.trim().toLowerCase(), freq: randomFreq(crews.map((c) => c.freq)), members: [] };
      crews.push(crew);
      join(crew);
      const dub: Dub = { code: randomCode(), crewId: crew.id, expiresAt: new Date(Date.now() + 7 * DAY).toISOString() };
      return { crew: plain(crew), dub };
    },
    async redeemDub(code) {
      await wait(900);
      const hit = DEMO_DUBS[normalizeDub(code)];
      if (!hit) throw new DubError('unknown');
      const crew = crews.find((c) => c.id === hit.crewId)!;
      if (joined.has(crew.id)) return plain(crew);
      if (hit.state) throw new DubError(hit.state);
      if (crew.members.length >= 8) throw new DubError('full');
      join(crew);
      return plain(crew);
    },
    async mintDub(crewId) {
      await wait();
      return { code: randomCode(), crewId, expiresAt: new Date(Date.now() + 7 * DAY).toISOString() };
    },
    async leaveCrew(crewId) {
      joined.delete(crewId);
      const c = crews.find((x) => x.id === crewId);
      if (c) c.members = c.members.filter((m) => m.id !== YOU.id);
    },

    async wire(limit) {
      return burns.filter(mine).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    },
    async deck(crewId): Promise<CrewDeck> {
      const c = crews.find((x) => x.id === crewId)!;
      return { ...plain(c), members: c.members, burns: burns.filter((b) => b.crewId === crewId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    },
    async thisWeek(crewId) {
      const since = new Date(Date.now() - 7 * DAY).toISOString();
      return burns.filter((b) => b.crewId === crewId && b.createdAt > since).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async resolveLink(url): Promise<Resolved> {
      await wait(650);
      const l = url.trim();
      if (!/^https?:\/\/\S+\.\S+/.test(l)) return { ok: false, reason: 'not_a_link' };
      if (/nope|unknown/.test(l)) return { ok: false, reason: 'not_found' };
      let h = 0;
      for (const ch of l) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return { ok: true, track: PICKS[h % PICKS.length] };
    },
    async rawTrack(url, title, artist) {
      return { id: `demo-raw-${Date.now()}`, title, artist, durationMs: null, artUrl: null, links: { raw: url } };
    },
    async burn({ crewId, trackId, note, heat }) {
      await wait(300);
      const track = [...PICKS, ...burns.map((b) => b.track)].find((t) => t.id === trackId)
        ?? { id: trackId, title: 'a song', artist: 'someone', durationMs: null, artUrl: null, links: {} };
      const b: Burn = { id: `demo-b-${Date.now()}`, crewId, crewName: crews.find((c) => c.id === crewId)!.name, track, from: YOU, note, heat, createdAt: new Date().toISOString() };
      burns.push(b);
      return b;
    },

    async etches(burnId) { return etches.filter((e) => e.burnId === burnId); },
    async etch(burnId, heat, note) {
      await wait(250);
      const i = etches.findIndex((e) => e.burnId === burnId && e.by.id === YOU.id);
      const e: Etch = { burnId, by: YOU, heat, note, createdAt: new Date().toISOString() };
      if (i >= 0) etches[i] = e; else etches.push(e);
    },

    async kept(): Promise<KeptDisc[]> {
      return kept.map((k) => ({ keptAt: k.keptAt, burn: burns.find((b) => b.id === k.burnId)! }))
        .filter((k) => k.burn && mine(k.burn))
        .sort((a, b) => b.keptAt.localeCompare(a.keptAt));
    },
    async keep(burnId) {
      if (!kept.some((k) => k.burnId === burnId)) kept.push({ burnId, keptAt: new Date().toISOString() });
    },
    async unkeep(burnId) {
      const i = kept.findIndex((k) => k.burnId === burnId);
      if (i >= 0) kept.splice(i, 1);
    },
  };
}
