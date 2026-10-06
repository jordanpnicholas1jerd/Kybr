// Time replaces numbers (spec §2): "today", "yesterday", "sunday", "last week".

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 'today' · 'yesterday' · 'sunday' · 'last week' · 'in march' */
export function whenWord(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 864e5);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return DAYS[d.getDay()];
  if (days < 14) return 'last week';
  if (d.getFullYear() === now.getFullYear()) return `in ${MONTHS[d.getMonth()]}`;
  return `in ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Short form for tight rows: 'today' · 'yest' · 'sun' · 'last wk' */
export function whenShort(iso: string, now = new Date()): string {
  const w = whenWord(iso, now);
  if (w === 'yesterday') return 'yest';
  if (DAYS.includes(w)) return w.slice(0, 3);
  if (w === 'last week') return 'last wk';
  if (w.startsWith('in ')) return w.slice(3, 6);
  return w;
}

/** 279000 → '4:39' */
export function duration(ms: number | null): string {
  if (!ms) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
