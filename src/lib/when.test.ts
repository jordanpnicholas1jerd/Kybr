import { describe, expect, it } from 'vitest';
import { duration, whenShort, whenWord } from './when';

const now = new Date(2026, 9, 6, 15, 0); // tue 6 oct 2026
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).toISOString();

describe('when', () => {
  it('speaks in time, not numbers', () => {
    expect(whenWord(at(2026, 9, 6, 1), now)).toBe('today');
    expect(whenWord(at(2026, 9, 5, 23), now)).toBe('yesterday');
    expect(whenWord(at(2026, 9, 4), now)).toBe('sunday');
    expect(whenWord(at(2026, 8, 28), now)).toBe('last week');
    expect(whenWord(at(2026, 2, 3), now)).toBe('in march');
    expect(whenWord(at(2025, 2, 3), now)).toBe('in march 2025');
    expect(whenShort(at(2026, 9, 4), now)).toBe('sun');
  });
  it('formats durations', () => {
    expect(duration(279000)).toBe('4:39');
    expect(duration(null)).toBe('');
  });
});
