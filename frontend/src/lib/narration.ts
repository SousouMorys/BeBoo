import type { WordTiming } from './types';

const estimatedSecondsPerWord = 0.46;

export function narrationWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function normalizeNarrationWord(word: string): string {
  return word.toLocaleLowerCase().replace(/[^\p{L}\p{N}'\u2019-]+/gu, '');
}

function isFiniteTiming(timing: WordTiming): boolean {
  return (
    Number.isFinite(timing.start) &&
    Number.isFinite(timing.end) &&
    timing.start >= 0 &&
    timing.end > timing.start
  );
}

/** Reject a timing map that cannot safely highlight the rendered story words. */
export function hasUsableNarrationTimings(text: string, timings: WordTiming[]): boolean {
  const words = narrationWords(text);

  return (
    words.length > 0 &&
    timings.length === words.length &&
    timings.every((timing, index) => {
      const previous = timings[index - 1];
      return (
        isFiniteTiming(timing) &&
        normalizeNarrationWord(timing.word) === normalizeNarrationWord(words[index]) &&
        (!previous || timing.start >= previous.end)
      );
    })
  );
}

/** Uses the media duration when available; the estimate is only for seed stories without audio. */
export function proportionalNarrationTimings(
  text: string,
  durationSeconds?: number | null,
): WordTiming[] {
  const words = narrationWords(text);
  if (words.length === 0) {
    return [];
  }

  const duration =
    typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : words.length * estimatedSecondsPerWord;
  const secondsPerWord = duration / words.length;

  return words.map((word, index) => ({
    word,
    start: index * secondsPerWord,
    end: (index + 1) * secondsPerWord,
  }));
}

export function wordIndexAtTime(timings: WordTiming[], currentTime: number): number {
  if (!Number.isFinite(currentTime) || currentTime < 0) {
    return -1;
  }

  const lastIndex = timings.length - 1;
  const activeIndex = timings.findIndex(
    (timing, index) =>
      currentTime >= timing.start &&
      (currentTime < timing.end || (index === lastIndex && currentTime <= timing.end)),
  );

  if (activeIndex !== -1) {
    return activeIndex;
  }

  return lastIndex >= 0 && currentTime > timings[lastIndex].end ? lastIndex : -1;
}
