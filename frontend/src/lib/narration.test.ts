import { describe, expect, it } from 'vitest';
import {
  hasUsableNarrationTimings,
  proportionalNarrationTimings,
  wordIndexAtTime,
} from './narration';

describe('narration timings', () => {
  it('accepts timestamps that match rendered words despite punctuation', () => {
    expect(
      hasUsableNarrationTimings('Sami waits. Sami smiles.', [
        { word: 'Sami', start: 0, end: 0.4 },
        { word: 'waits', start: 0.4, end: 0.8 },
        { word: 'SAMI', start: 0.8, end: 1.2 },
        { word: 'smiles', start: 1.2, end: 1.6 },
      ]),
    ).toBe(true);
  });

  it('falls back to equal word ranges over the known audio duration', () => {
    expect(proportionalNarrationTimings('One two three', 6)).toEqual([
      { word: 'One', start: 0, end: 2 },
      { word: 'two', start: 2, end: 4 },
      { word: 'three', start: 4, end: 6 },
    ]);
  });

  it('rejects mismatched or overlapping timing maps', () => {
    expect(
      hasUsableNarrationTimings('Sami waits', [
        { word: 'Sami', start: 0.5, end: 1 },
        { word: 'waits', start: 0.75, end: 1.25 },
      ]),
    ).toBe(false);
  });

  it('selects the word from the audio media time', () => {
    const timings = proportionalNarrationTimings('One two three', 6);

    expect(wordIndexAtTime(timings, 0.2)).toBe(0);
    expect(wordIndexAtTime(timings, 2.1)).toBe(1);
    expect(wordIndexAtTime(timings, 5.9)).toBe(2);
    expect(wordIndexAtTime(timings, 6.4)).toBe(2);
  });
});
