// The one heat scale, shared by ETCH and album reviews (spec §4.5).
// Always rendered as stars and words, never as a number.
export type Heat = 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

const WORDS: Record<number, string> = {
  0.5: 'frozen', 1: 'cold', 1.5: 'cool', 2: 'room temp', 2.5: 'lukewarm',
  3: 'warm', 3.5: 'toasty', 4: 'hot', 4.5: 'burning', 5: 'scorching',
};

export function heatWord(h: number | null | undefined): string {
  return (h && WORDS[h]) || 'no heat yet';
}

/** 4.5 → '★★★★½' */
export function heatStars(h: number | null | undefined): string {
  if (!h) return '';
  return '★'.repeat(Math.floor(h)) + (h % 1 ? '½' : '');
}

/**
 * Tapping star n sets n; tapping the same star again drops half a star;
 * tapping once more goes back up.
 */
export function tapStar(current: number, n: number): Heat {
  return (current === n ? n - 0.5 : n) as Heat;
}

/** How full star cell n (1–5) is for heat h. */
export function starFill(h: number, n: number): 0 | 0.5 | 1 {
  return h >= n ? 1 : h >= n - 0.5 ? 0.5 : 0;
}
