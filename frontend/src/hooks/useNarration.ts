import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  hasUsableNarrationTimings,
  proportionalNarrationTimings,
  wordIndexAtTime,
} from '../lib/narration';
import type { WordTiming } from '../lib/types';

interface NarrationOptions {
  text: string;
  timings: WordTiming[];
  audioUrl: string | null;
  playbackRate: number;
}

export function useNarration({ text, timings, audioUrl, playbackRate }: NarrationOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const elapsedSecondsRef = useRef(0);
  const playbackRateRef = useRef(playbackRate);
  const timingsRef = useRef<WordTiming[]>([]);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  playbackRateRef.current = playbackRate;

  const resolvedTimings = useMemo(() => {
    if (hasUsableNarrationTimings(text, timings)) {
      return timings;
    }

    // A generated page waits for its real duration before using a proportional map.
    // Seed stories deliberately have no audio, so they keep their visual fallback.
    if (audioUrl && mediaDuration === null) {
      return [];
    }

    return proportionalNarrationTimings(text, mediaDuration);
  }, [audioUrl, mediaDuration, text, timings]);
  const fallbackDuration = resolvedTimings[resolvedTimings.length - 1]?.end ?? 0;
  timingsRef.current = resolvedTimings;

  const setWordFromMediaTime = useCallback((currentTime: number) => {
    const nextIndex = wordIndexAtTime(timingsRef.current, currentTime);
    setActiveWordIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex,
    );
  }, []);

  useEffect(() => {
    elapsedSecondsRef.current = 0;
    setMediaDuration(null);
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setIsComplete(false);

    if (!audioUrl) {
      audioRef.current = null;
      return undefined;
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audio.playbackRate = playbackRateRef.current;

    const onLoadedMetadata = () => {
      setMediaDuration(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    };
    const onPlay = () => {
      setIsPlaying(true);
      setIsComplete(false);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      elapsedSecondsRef.current = audio.duration;
      setWordFromMediaTime(audio.duration);
      setIsPlaying(false);
      setIsComplete(true);
    };
    const onError = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [audioUrl, setWordFromMediaTime, text]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!audioUrl || !isPlaying) {
      return undefined;
    }

    let animationFrame = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) {
        return;
      }

      setWordFromMediaTime(audio.currentTime);
      animationFrame = window.requestAnimationFrame(tick);
    };

    tick();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [audioUrl, isPlaying, setWordFromMediaTime]);

  useEffect(() => {
    if (audioUrl || !isPlaying || fallbackDuration <= 0) {
      return undefined;
    }

    let animationFrame = 0;
    const startedAt = window.performance.now();
    const elapsedAtStart = elapsedSecondsRef.current;
    const tick = (now: number) => {
      const elapsedSeconds = Math.min(
        fallbackDuration,
        elapsedAtStart + ((now - startedAt) / 1000) * playbackRate,
      );
      elapsedSecondsRef.current = elapsedSeconds;
      setWordFromMediaTime(elapsedSeconds);

      if (elapsedSeconds >= fallbackDuration) {
        setIsPlaying(false);
        setIsComplete(true);
        return;
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [audioUrl, fallbackDuration, isPlaying, playbackRate, setWordFromMediaTime]);

  const toggle = useCallback(() => {
    if (audioUrl) {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      if (!audio.paused) {
        audio.pause();
        return;
      }

      if (audio.ended || isComplete) {
        audio.currentTime = 0;
        elapsedSecondsRef.current = 0;
        setActiveWordIndex(-1);
        setIsComplete(false);
      }

      audio.playbackRate = playbackRate;
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (fallbackDuration <= 0) {
      return;
    }

    if (isComplete || elapsedSecondsRef.current >= fallbackDuration) {
      elapsedSecondsRef.current = 0;
      setActiveWordIndex(-1);
      setIsComplete(false);
    }

    setIsPlaying(true);
  }, [audioUrl, fallbackDuration, isComplete, isPlaying, playbackRate]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    elapsedSecondsRef.current = 0;
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setIsComplete(false);
  }, []);

  return { activeWordIndex, isComplete, isPlaying, stop, toggle };
}
