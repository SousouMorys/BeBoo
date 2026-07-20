import { describe, expect, it } from 'vitest';
import { proportionalTimings, timingsFromTranscription } from './timings.js';

describe('timingsFromTranscription', () => {
  it('uses Whisper timings after normalizing punctuation and case', () => {
    const timings = timingsFromTranscription('Sami waits. Sami smiles.', {
      duration: 2,
      words: [
        { word: 'sami', start: 0, end: 0.3 },
        { word: 'waits', start: 0.3, end: 0.8 },
        { word: 'sami', start: 1, end: 1.3 },
        { word: 'smiles', start: 1.3, end: 1.8 },
      ],
    });

    expect(timings).toEqual([
      { word: 'Sami', start: 0, end: 0.3 },
      { word: 'waits.', start: 0.3, end: 0.8 },
      { word: 'Sami', start: 1, end: 1.3 },
      { word: 'smiles.', start: 1.3, end: 1.8 },
    ]);
  });

  it('accepts a ninety-percent match by producing a complete timing map', () => {
    const timings = timingsFromTranscription('one two three four five six seven eight nine ten', {
      duration: 10,
      words: [
        { word: 'one', start: 0, end: 0.5 },
        { word: 'two', start: 0.5, end: 1 },
        { word: 'three', start: 1, end: 1.5 },
        { word: 'four', start: 1.5, end: 2 },
        { word: 'five', start: 2, end: 2.5 },
        { word: 'six', start: 2.5, end: 3 },
        { word: 'seven', start: 3, end: 3.5 },
        { word: 'eight', start: 3.5, end: 4 },
        { word: 'nine', start: 4, end: 4.5 },
      ],
    });

    expect(timings).toHaveLength(10);
    expect(timings?.every((timing, index) => timing.word === ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][index])).toBe(true);
  });

  it('rejects a transcript below the ninety-percent word match threshold', () => {
    const timings = timingsFromTranscription('one two three four five six seven eight nine ten', {
      duration: 10,
      words: [
        { word: 'one', start: 0, end: 0.5 },
        { word: 'two', start: 0.5, end: 1 },
        { word: 'three', start: 1, end: 1.5 },
        { word: 'four', start: 1.5, end: 2 },
        { word: 'five', start: 2, end: 2.5 },
        { word: 'six', start: 2.5, end: 3 },
        { word: 'seven', start: 3, end: 3.5 },
        { word: 'eight', start: 3.5, end: 4 },
      ],
    });

    expect(timings).toBeNull();
  });

  it('rejects non-monotonic timings and falls back proportionally', () => {
    const result = timingsFromTranscription('Sami feels calm.', {
      duration: 2,
      words: [
        { word: 'Sami', start: 0, end: 0.5 },
        { word: 'feels', start: 0.4, end: 0.8 },
        { word: 'calm', start: 0.8, end: 1.2 },
      ],
    });

    expect(result).toBeNull();
    expect(proportionalTimings('Sami feels calm.', 3)).toEqual([
      { word: 'Sami', start: 0, end: 1 },
      { word: 'feels', start: 1, end: 2 },
      { word: 'calm.', start: 2, end: 3 },
    ]);
  });
});
