import type { SkinKey } from '../theme/skins';

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
}

export interface Crew {
  id: string;
  name: string;
  freq: string;
}

export interface Dub {
  code: string;      // 6 chars, no 0/O/1/I
  crewId: string;
  expiresAt: string; // ISO
}

/** Why a DUB didn't work. The answering machine turns these into LCD copy. */
export type DubFailure = 'unknown' | 'used' | 'expired' | 'full';

export class DubError extends Error {
  constructor(public reason: DubFailure) {
    super(reason);
  }
}

/** Why a greeting (handle) couldn't be saved. */
export class HandleTakenError extends Error {}

export type Service = 'apple' | 'youtube' | 'spotify' | 'link';

/** One song, playable on any service. `links` maps Odesli platform → url. */
export interface Track {
  id: string;
  title: string;
  artist: string;
  durationMs: number | null;
  artUrl: string | null;
  links: Record<string, string>;
}

export interface Person {
  id: string;
  displayName: string;
}

export interface Burn {
  id: string;
  crewId: string;
  crewName: string;
  track: Track;
  from: Person;
  note: string | null;
  heat: number | null;
  createdAt: string;
}

export interface Etch {
  burnId: string;
  by: Person;
  heat: number;
  note: string | null;
  createdAt: string;
}

export interface CrewDeck extends Crew {
  members: Person[];
  /** newest first */
  burns: Burn[];
}

export interface KeptDisc {
  burn: Burn;
  keptAt: string;
}

export interface Settings {
  skin: SkinKey;
  preferredService: Service;
}

/** What resolving a pasted link gave back. */
export type Resolved =
  | { ok: true; track: Track }
  | { ok: false; reason: 'not_a_link' | 'not_found' | 'unavailable' | 'not_a_song' };

export interface Session {
  userId: string;
  email: string | null;
}

/**
 * Everything the app asks of the backend. Two implementations:
 * demo (in memory, prototype data) and live (Supabase).
 */
export interface KybrApi {
  mode: 'demo' | 'live';

  /** current session, or null when signed out */
  session(): Promise<Session | null>;
  /** subscribe to sign-in / sign-out; returns an unsubscribe */
  onSessionChange(cb: (s: Session | null) => void): () => void;
  /** email a magic link */
  sendMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;

  me(): Promise<Profile | null>;
  createProfile(handle: string, displayName: string): Promise<Profile>;
  settings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<void>;

  myCrews(): Promise<Crew[]>;
  createCrew(name: string): Promise<{ crew: Crew; dub: Dub }>;
  redeemDub(code: string): Promise<Crew>;
  mintDub(crewId: string): Promise<Dub>;
  leaveCrew(crewId: string): Promise<void>;

  /** newest burns across your crews */
  wire(limit: number): Promise<Burn[]>;
  /** a crew's rack: members and burns, newest first */
  deck(crewId: string): Promise<CrewDeck>;
  /** a crew's burns from the last 7 days, oldest first */
  thisWeek(crewId: string): Promise<Burn[]>;

  resolveLink(url: string): Promise<Resolved>;
  /** a song named by hand when its link couldn't be read */
  rawTrack(url: string, title: string, artist: string): Promise<Track>;
  burn(input: { crewId: string; trackId: string; note: string | null; heat: number | null }): Promise<Burn>;

  etches(burnId: string): Promise<Etch[]>;
  etch(burnId: string, heat: number, note: string | null): Promise<void>;

  /** your CASE, most recently kept first */
  kept(): Promise<KeptDisc[]>;
  keep(burnId: string): Promise<void>;
  unkeep(burnId: string): Promise<void>;
}

/** 'k7q 4zp' / 'K7Q-4ZP' → 'K7Q4ZP' */
export function normalizeDub(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** 'K7Q4ZP' → 'K7Q·4ZP' */
export function formatDub(code: string): string {
  const c = normalizeDub(code);
  return c.length > 3 ? `${c.slice(0, 3)}·${c.slice(3)}` : c;
}

export const DUB_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const CREW_NAME_RE = /^[a-z0-9 ._-]{1,24}$/;
