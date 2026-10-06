import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SKIN, isSkinKey, type SkinKey } from '../theme/skins';
import {
  DubError, HandleTakenError, normalizeDub,
  type Crew, type Dub, type DubFailure, type KybrApi, type Session,
} from './types';

// Live mode: Supabase. Privacy is enforced by row level security in
// supabase/migrations; this file never decides who can see what.

const DUB_HINTS: Record<string, DubFailure> = {
  dub_unknown: 'unknown', dub_used: 'used', dub_expired: 'expired', crew_full: 'full',
};

function fail(error: PostgrestError | Error): never {
  const hint = 'hint' in error ? error.hint : undefined;
  if (hint && DUB_HINTS[hint]) throw new DubError(DUB_HINTS[hint]);
  throw error;
}

const toCrew = (r: { id: string; name: string; freq: string }): Crew => ({ id: r.id, name: r.name, freq: r.freq });
const toDub = (r: { code: string; crew_id: string; expires_at: string }): Dub =>
  ({ code: r.code, crewId: r.crew_id, expiresAt: r.expires_at });

export function createLiveApi(url: string, anonKey: string): KybrApi {
  const sb: SupabaseClient = createClient(url, anonKey);

  const toSession = (s: { user: { id: string; email?: string } } | null): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? null } : null;

  const uid = async () => {
    const { data } = await sb.auth.getSession();
    if (!data.session) throw new Error('signed out');
    return data.session.user.id;
  };

  return {
    mode: 'live',

    async session() {
      const { data } = await sb.auth.getSession();
      return toSession(data.session);
    },
    onSessionChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
      return () => data.subscription.unsubscribe();
    },
    async sendMagicLink(email) {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
    },
    async signOut() {
      await sb.auth.signOut();
    },

    async me() {
      const id = await uid();
      const { data, error } = await sb.from('profiles').select('id, handle, display_name').eq('id', id).maybeSingle();
      if (error) fail(error);
      return data ? { id: data.id, handle: data.handle, displayName: data.display_name } : null;
    },
    async createProfile(handle, displayName) {
      const id = await uid();
      const { data, error } = await sb.from('profiles')
        .insert({ id, handle, display_name: displayName })
        .select('id, handle, display_name').single();
      if (error) {
        if (error.code === '23505') throw new HandleTakenError();
        fail(error);
      }
      await sb.from('settings').insert({ user_id: id });
      return { id: data.id, handle: data.handle, displayName: data.display_name };
    },
    async skin(): Promise<SkinKey> {
      const { data } = await sb.from('settings').select('skin').maybeSingle();
      return isSkinKey(data?.skin) ? data.skin : DEFAULT_SKIN;
    },

    async myCrews() {
      // RLS returns only crews you're in.
      const { data, error } = await sb.from('crews').select('id, name, freq').order('created_at');
      if (error) fail(error);
      return data.map(toCrew);
    },
    async createCrew(name) {
      const { data, error } = await sb.rpc('create_crew', { p_name: name }).single<{ crew: never; dub: never }>();
      if (error) fail(error);
      return { crew: toCrew(data.crew), dub: toDub(data.dub) };
    },
    async redeemDub(code) {
      const { data, error } = await sb.rpc('redeem_dub', { p_code: normalizeDub(code) }).single<never>();
      if (error) fail(error);
      return toCrew(data);
    },
    async mintDub(crewId) {
      const { data, error } = await sb.rpc('create_dub', { p_crew_id: crewId }).single<never>();
      if (error) fail(error);
      return toDub(data);
    },
  };
}
