import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SKIN, isSkinKey } from '../theme/skins';
import {
  DubError, HandleTakenError, normalizeDub,
  type Burn, type Crew, type Dub, type DubFailure, type Etch, type KybrApi, type Person,
  type Service, type Session, type Settings, type Track,
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

const TRACK = 'id, title, artist, duration_ms, art_url, links';
const BURN = `id, crew_id, note, heat, created_at, crew:crews(name), from:profiles!burns_from_user_fkey(id, display_name), track:tracks(${TRACK})`;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

export const toTrack = (r: Row): Track => ({
  id: r.id, title: r.title, artist: r.artist, durationMs: r.duration_ms ?? null, artUrl: r.art_url ?? null, links: r.links ?? {},
});
const toPerson = (r: Row): Person => ({ id: r.id, displayName: r.display_name });
const toBurn = (r: Row): Burn => ({
  id: r.id, crewId: r.crew_id, crewName: r.crew?.name ?? '', track: toTrack(r.track), from: toPerson(r.from),
  note: r.note, heat: r.heat === null ? null : Number(r.heat), createdAt: r.created_at,
});
const SERVICES: Service[] = ['apple', 'youtube', 'spotify', 'link'];

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
    async settings(): Promise<Settings> {
      const { data } = await sb.from('settings').select('skin, preferred_service').maybeSingle();
      return {
        skin: isSkinKey(data?.skin) ? data.skin : DEFAULT_SKIN,
        preferredService: SERVICES.includes(data?.preferred_service) ? data!.preferred_service : 'link',
      };
    },
    async saveSettings(patch) {
      const id = await uid();
      const row: Row = { user_id: id };
      if (patch.skin) row.skin = patch.skin;
      if (patch.preferredService) row.preferred_service = patch.preferredService;
      const { error } = await sb.from('settings').upsert(row, { onConflict: 'user_id' });
      if (error) fail(error);
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
    async leaveCrew(crewId) {
      const id = await uid();
      const { error } = await sb.from('crew_members').delete().eq('crew_id', crewId).eq('user_id', id);
      if (error) fail(error);
    },

    async wire(limit) {
      // RLS limits burns to your crews.
      const { data, error } = await sb.from('burns').select(BURN).order('created_at', { ascending: false }).limit(limit);
      if (error) fail(error);
      return data.map(toBurn);
    },
    async deck(crewId) {
      const [crew, members, burns] = await Promise.all([
        sb.from('crews').select('id, name, freq').eq('id', crewId).single(),
        sb.from('crew_members').select('joined_at, profile:profiles!crew_members_user_id_fkey(id, display_name)').eq('crew_id', crewId).order('joined_at'),
        sb.from('burns').select(BURN).eq('crew_id', crewId).order('created_at', { ascending: false }).limit(60),
      ]);
      if (crew.error) fail(crew.error);
      if (members.error) fail(members.error);
      if (burns.error) fail(burns.error);
      return {
        ...toCrew(crew.data),
        members: members.data.map((m: Row) => toPerson(m.profile)),
        burns: burns.data.map(toBurn),
      };
    },
    async thisWeek(crewId) {
      const { data, error } = await sb.from('this_week').select(BURN).eq('crew_id', crewId).order('created_at');
      if (error) fail(error);
      return data.map(toBurn);
    },

    async resolveLink(url) {
      const { data, error } = await sb.functions.invoke('resolve-link', { body: { url } });
      if (error || !data) return { ok: false, reason: 'unavailable' };
      return data.resolved ? { ok: true, track: toTrack(data.track) } : { ok: false, reason: data.reason ?? 'unavailable' };
    },
    async rawTrack(url, title, artist) {
      const { data, error } = await sb.rpc('create_raw_track', { p_url: url, p_title: title, p_artist: artist }).single();
      if (error) fail(error);
      return toTrack(data);
    },
    async burn({ crewId, trackId, note, heat }) {
      const id = await uid();
      const { data, error } = await sb.from('burns')
        .insert({ crew_id: crewId, track_id: trackId, from_user: id, note, heat })
        .select(BURN).single();
      if (error) fail(error);
      return toBurn(data);
    },

    async etches(burnId) {
      const { data, error } = await sb.from('etches')
        .select('burn_id, heat, note, created_at, by:profiles!etches_user_id_fkey(id, display_name)')
        .eq('burn_id', burnId).order('created_at');
      if (error) fail(error);
      return data.map((r: Row): Etch => ({ burnId: r.burn_id, by: toPerson(r.by), heat: Number(r.heat), note: r.note, createdAt: r.created_at }));
    },
    async etch(burnId, heat, note) {
      const id = await uid();
      const { error } = await sb.from('etches')
        .upsert({ burn_id: burnId, user_id: id, heat, note, created_at: new Date().toISOString() }, { onConflict: 'burn_id,user_id' });
      if (error) fail(error);
    },

    async kept() {
      const { data, error } = await sb.from('kept').select(`kept_at, burn:burns(${BURN})`).order('kept_at', { ascending: false });
      if (error) fail(error);
      // A burn from a crew you've left is no longer visible to you.
      return data.filter((r: Row) => r.burn).map((r: Row) => ({ keptAt: r.kept_at, burn: toBurn(r.burn) }));
    },
    async keep(burnId) {
      const id = await uid();
      const { error } = await sb.from('kept').upsert({ user_id: id, burn_id: burnId }, { onConflict: 'user_id,burn_id', ignoreDuplicates: true });
      if (error) fail(error);
    },
    async unkeep(burnId) {
      const { error } = await sb.from('kept').delete().eq('burn_id', burnId);
      if (error) fail(error);
    },
  };
}
