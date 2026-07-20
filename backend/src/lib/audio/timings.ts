export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

interface TranscribedWord {
  word: string;
  start: number;
  end: number;
}

interface TranscriptionData {
  duration?: unknown;
  words?: unknown;
}

const estimatedSecondsPerWord = 0.46;

export function storyWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function normalized(word: string): string {
  return word.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu)?.join('') ?? '';
}

function isPositiveDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function transcribedWords(value: unknown): TranscribedWord[] | null {
  if (!Array.isArray(value)) return null;

  const words: TranscribedWord[] = [];
  let previousStart = -1;
  let previousEnd = -1;

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const candidate = item as Partial<TranscribedWord>;
    if (
      typeof candidate.word !== 'string' ||
      typeof candidate.start !== 'number' ||
      typeof candidate.end !== 'number' ||
      !Number.isFinite(candidate.start) ||
      !Number.isFinite(candidate.end) ||
      candidate.start < 0 ||
      candidate.end < candidate.start ||
      candidate.start < previousStart ||
      candidate.start < previousEnd ||
      candidate.end < previousEnd
    ) {
      return null;
    }

    words.push({ word: candidate.word, start: candidate.start, end: candidate.end });
    previousStart = candidate.start;
    previousEnd = candidate.end;
  }

  return words;
}

function longestCommonSubsequence(source: string[], transcription: string[]): Array<[number, number]> {
  const scores = Array.from({ length: source.length + 1 }, () => Array<number>(transcription.length + 1).fill(0));

  for (let sourceIndex = source.length - 1; sourceIndex >= 0; sourceIndex -= 1) {
    for (let transcriptIndex = transcription.length - 1; transcriptIndex >= 0; transcriptIndex -= 1) {
      scores[sourceIndex][transcriptIndex] = source[sourceIndex] === transcription[transcriptIndex]
        ? scores[sourceIndex + 1][transcriptIndex + 1] + 1
        : Math.max(scores[sourceIndex + 1][transcriptIndex], scores[sourceIndex][transcriptIndex + 1]);
    }
  }

  const pairs: Array<[number, number]> = [];
  let sourceIndex = 0;
  let transcriptIndex = 0;
  while (sourceIndex < source.length && transcriptIndex < transcription.length) {
    if (
      source[sourceIndex] !== '' &&
      source[sourceIndex] === transcription[transcriptIndex]
    ) {
      pairs.push([sourceIndex, transcriptIndex]);
      sourceIndex += 1;
      transcriptIndex += 1;
    } else if (scores[sourceIndex + 1][transcriptIndex] >= scores[sourceIndex][transcriptIndex + 1]) {
      sourceIndex += 1;
    } else {
      transcriptIndex += 1;
    }
  }

  return pairs;
}

export function proportionalTimings(text: string, duration?: number): WordTiming[] {
  const words = storyWords(text);
  if (words.length === 0) return [];

  const total = isPositiveDuration(duration) ? duration : words.length * estimatedSecondsPerWord;
  return words.map((word, index) => ({
    word,
    start: (index / words.length) * total,
    end: ((index + 1) / words.length) * total,
  }));
}

function fillGaps(
  words: string[],
  mapped: Array<WordTiming | undefined>,
  duration: number | undefined,
): WordTiming[] | null {
  const timings = [...mapped];
  let index = 0;

  while (index < timings.length) {
    if (timings[index]) {
      index += 1;
      continue;
    }

    const firstMissing = index;
    while (index < timings.length && !timings[index]) index += 1;
    const afterMissing = index;
    const previousEnd = timings[firstMissing - 1]?.end ?? 0;
    const nextStart = timings[afterMissing]?.start ?? duration;
    if (!isPositiveDuration(nextStart) || nextStart <= previousEnd) return null;

    const step = (nextStart - previousEnd) / (afterMissing - firstMissing);
    for (let gapIndex = firstMissing; gapIndex < afterMissing; gapIndex += 1) {
      const offset = gapIndex - firstMissing;
      timings[gapIndex] = {
        word: words[gapIndex],
        start: previousEnd + offset * step,
        end: previousEnd + (offset + 1) * step,
      };
    }
  }

  return timings as WordTiming[];
}

/** Returns source-token timings only when Whisper's timestamps are trustworthy. */
export function timingsFromTranscription(text: string, transcription: TranscriptionData): WordTiming[] | null {
  const words = storyWords(text);
  if (words.length === 0) return [];

  const observed = transcribedWords(transcription.words);
  if (!observed || observed.length === 0) return null;

  const pairs = longestCommonSubsequence(words.map(normalized), observed.map((item) => normalized(item.word)));
  if (pairs.length / words.length < 0.9) return null;

  const mapped: Array<WordTiming | undefined> = Array<WordTiming | undefined>(words.length).fill(undefined);
  for (const [sourceIndex, transcriptIndex] of pairs) {
    mapped[sourceIndex] = { ...observed[transcriptIndex], word: words[sourceIndex] };
  }

  return fillGaps(words, mapped, isPositiveDuration(transcription.duration) ? transcription.duration : undefined)
    ?? proportionalTimings(text, isPositiveDuration(transcription.duration) ? transcription.duration : observed.at(-1)?.end);
}
