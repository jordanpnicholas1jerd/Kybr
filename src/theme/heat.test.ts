import { describe, expect, it } from 'vitest';
import { heatStars, heatWord, starFill, tapStar } from './heat';

describe('heat', () => {
  it('renders stars and words, never numbers', () => {
    expect(heatStars(4.5)).toBe('★★★★½');
    expect(heatStars(5)).toBe('★★★★★');
    expect(heatStars(0.5)).toBe('½');
    expect(heatWord(4.5)).toBe('burning');
    expect(heatWord(0)).toBe('no heat yet');
  });

  it('taps cycle whole → half → whole', () => {
    expect(tapStar(0, 4)).toBe(4);
    expect(tapStar(4, 4)).toBe(3.5);
    expect(tapStar(3.5, 4)).toBe(4);
    expect(tapStar(1, 1)).toBe(0.5);
  });

  it('fills star cells', () => {
    expect([1, 2, 3, 4, 5].map((n) => starFill(3.5, n))).toEqual([1, 1, 1, 0.5, 0]);
  });
});
