import { DEFAULT_SKIN, type SkinKey } from '../theme/skins';
import {
  DUB_ALPHABET, DubError, HandleTakenError, normalizeDub,
  type Crew, type Dub, type KybrApi, type Profile, type Session,
} from './types';

// Demo mode: fake data from the prototype, kept in memory. Nothing is saved;
// reloading starts over at the answering machine. You're already signed in.

interface DemoCrew extends Crew { members: number }

const PROTOTYPE_CREWS: DemoCrew[] = [
  { id: 'demo-family',   name: 'family',   freq: '92.1',  members: 4 },
  { id: 'demo-basement', name: 'basement', freq: '98.6',  members: 7 },
  { id: 'demo-roadtrip', name: 'roadtrip', freq: '104.3', members: 6 },
  { id: 'demo-full',     name: 'full house', freq: '101.1', members: 8 },
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

export function createDemoApi(): KybrApi {
  const session: Session = { userId: 'demo-you', email: 'you@demo.kybr' };
  let profile: Profile | null = { id: 'demo-you', handle: 'you', displayName: 'you' };
  const joined: DemoCrew[] = [];

  return {
    mode: 'demo',
    async session() { return session; },
    onSessionChange() { return () => {}; },
    async sendMagicLink() { await wait(); },
    async signOut() { joined.length = 0; },

    async me() { return profile; },
    async createProfile(handle, displayName) {
      await wait();
      if (['mara', 'dev', 'sof'].includes(handle)) throw new HandleTakenError();
      profile = { id: session.userId, handle, displayName };
      return profile;
    },
    async skin(): Promise<SkinKey> { return DEFAULT_SKIN; },

    async myCrews() { return joined.map(({ id, name, freq }) => ({ id, name, freq })); },
    async createCrew(name) {
      await wait(700);
      const crew: DemoCrew = {
        id: `demo-${Date.now()}`,
        name: name.trim().toLowerCase(),
        freq: randomFreq(joined.map((c) => c.freq)),
        members: 1,
      };
      joined.push(crew);
      const dub: Dub = { code: randomCode(), crewId: crew.id, expiresAt: new Date(Date.now() + 7 * 864e5).toISOString() };
      return { crew: { id: crew.id, name: crew.name, freq: crew.freq }, dub };
    },
    async redeemDub(code) {
      await wait(900);
      const hit = DEMO_DUBS[normalizeDub(code)];
      if (!hit) throw new DubError('unknown');
      const crew = PROTOTYPE_CREWS.find((c) => c.id === hit.crewId)!;
      const already = joined.find((c) => c.id === crew.id);
      if (already) return { id: crew.id, name: crew.name, freq: crew.freq };
      if (hit.state) throw new DubError(hit.state);
      if (crew.members >= 8) throw new DubError('full');
      joined.push({ ...crew, members: crew.members + 1 });
      return { id: crew.id, name: crew.name, freq: crew.freq };
    },
    async mintDub(crewId) {
      await wait();
      return { code: randomCode(), crewId, expiresAt: new Date(Date.now() + 7 * 864e5).toISOString() };
    },
  };
}
