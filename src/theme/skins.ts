// The one shared skin list (spec §4.1). "Ember" in older notes is Sunset.
export type SkinKey = 'uv' | 'sunset' | 'ice' | 'volt' | 'heat' | 'mint';

export interface Skin {
  key: SkinKey;
  name: string;
  c: string;  // accent
  lo: string; // light
  hi: string; // deep
  q: string;  // the line CTRL shows for this skin
}

export const SKINS: Record<SkinKey, Skin> = {
  uv:     { key: 'uv',     name: 'UV',     c: '#C084FF', lo: '#e7c8ff', hi: '#7a3fd0', q: 'what basement put you on' },
  sunset: { key: 'sunset', name: 'Sunset', c: '#FF8A3D', lo: '#ffd6a8', hi: '#d75a2a', q: 'golden hour on the roadtrip' },
  ice:    { key: 'ice',    name: 'Ice',    c: '#6FD3E8', lo: '#cdf6ff', hi: '#2a9fc4', q: 'cold open, warm inside' },
  volt:   { key: 'volt',   name: 'Volt',   c: '#C6F24E', lo: '#eaffb0', hi: '#7fb02a', q: 'loud in a good way' },
  heat:   { key: 'heat',   name: 'Heat',   c: '#FF4D3D', lo: '#ffcabf', hi: '#c42a1a', q: 'still warm. too warm.' },
  mint:   { key: 'mint',   name: 'Mint',   c: '#2bd07a', lo: '#b8ffd9', hi: '#1a8f54', q: 'fresh out the case' },
};

/** CTRL shows every skin, in this order. */
export const SKIN_ORDER: SkinKey[] = ['uv', 'sunset', 'ice', 'volt', 'heat', 'mint'];

/** CASE's quick row: four swatches fit beside the DISC pill. */
export const CASE_QUICK_SKINS: SkinKey[] = ['uv', 'sunset', 'mint', 'ice'];

export const DEFAULT_SKIN: SkinKey = 'uv';

export function isSkinKey(v: unknown): v is SkinKey {
  return typeof v === 'string' && v in SKINS;
}

/** '#C084FF' → 'rgba(192,132,255,a)' */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
