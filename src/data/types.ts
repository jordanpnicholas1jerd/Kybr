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
  skin(): Promise<SkinKey>;

  myCrews(): Promise<Crew[]>;
  createCrew(name: string): Promise<{ crew: Crew; dub: Dub }>;
  redeemDub(code: string): Promise<Crew>;
  mintDub(crewId: string): Promise<Dub>;
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
