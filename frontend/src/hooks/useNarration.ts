import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WordTiming } from '../lib/types';

const millisecondsPerWord = 460;

function wordsIn(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

interface NarrationOptions {
  text: string;
  timings: WordTiming[];
  playbackRate: number;
}

export function useNarration({ text, timings, playbackRate }: NarrationOptions) {
  const words = useMemo(() => wordsIn(text), [text]);
  const usableTimings = useMemo(
    () =>
      timings.length === words.length &&
      timings.every((timing) => timing.start >= 0 && timing.end >= timing.start),
    [timings, words.length],
  );
  const durationMs = useMemo(() => {
    if (usableTimings && timings.length > 0) {
      return timings[timings.length - 1].end * 1000;
    }

    return words.length * millisecondsPerWord;
  }, [timings, usableTimings, words.length]);

  const elapsedRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  const indexForElapsed = useCallback(
    (elapsedMs: number): number => {
      if (words.length === 0) {
        return -1;
      }

      if (usableTimings) {
        const elapsedSeconds = elapsedMs / 1000;
        const timedIndex = timings.findIndex(
          (timing) => elapsedSeconds >= timing.start && elapsedSeconds < timing.end,
        );

        return timedIndex === -1 ? words.length - 1 : timedIndex;
      }

      return Math.min(words.length - 1, Math.floor(elapsedMs / millisecondsPerWord));
    },
    [timings, usableTimings, words.length],
  );

  useEffect(() => {
    if (!isPlaying || durationMs === 0) {
      return undefined;
    }

    let animationFrame = 0;
    const startedAt = window.performance.now();
    const elapsedAtStart = elapsedRef.current;

    const tick = (now: number) => {
      const elapsedMs = Math.min(
        durationMs,
        elapsedAtStart + (now - startedAt) * playbackRate,
      );
      elapsedRef.current = elapsedMs;
      const nextIndex = indexForElapsed(elapsedMs);
      setActiveWordIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));

      if (elapsedMs >= durationMs) {
        setIsPlaying(false);
        setIsComplete(true);
        return;
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationMs, indexForElapsed, isPlaying, playbackRate]);

  useEffect(() => {
    elapsedRef.current = 0;
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setIsComplete(false);
  }, [text]);

  const play = useCallback(() => {
    if (durationMs === 0) {
      return;
    }

    if (isComplete || elapsedRef.current >= durationMs) {
      elapsedRef.current = 0;
      setActiveWordIndex(-1);
      setIsComplete(false);
    }

    setIsPlaying(true);
  }, [durationMs, isComplete]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }

    play();
  }, [isPlaying, pause, play]);

  const stop = useCallback(() => {
    elapsedRef.current = 0;
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setIsComplete(false);
  }, []);

  return {
    activeWordIndex,
    isComplete,
    isPlaying,
    stop,
    toggle,
  };
}
