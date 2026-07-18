import { useCallback, useEffect, useState } from 'react';
import { BigButton } from './BigButton';
import { EmotionFace } from './EmotionFace';

type BreathPhase = 'idle' | 'in' | 'out';

interface BreathingCircleProps {
  reducedMotion: boolean;
  onComplete: () => void;
}

/**
 * The shared C2a regulation tool. It has no visible duration or cycle count;
 * a child begins it explicitly, and reduced-motion users advance each cue by tap.
 */
export function BreathingCircle({ reducedMotion, onComplete }: BreathingCircleProps) {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [completedCycles, setCompletedCycles] = useState(0);

  const advance = useCallback(() => {
    if (phase === 'idle') {
      setCompletedCycles(0);
      setPhase('in');
      return;
    }

    if (phase === 'in') {
      setPhase('out');
      return;
    }

    if (completedCycles === 2) {
      onComplete();
      return;
    }

    setCompletedCycles((current) => current + 1);
    setPhase('in');
  }, [completedCycles, onComplete, phase]);

  useEffect(() => {
    if (reducedMotion || phase === 'idle') {
      return undefined;
    }

    const timeoutId = window.setTimeout(advance, 4_000);
    return () => window.clearTimeout(timeoutId);
  }, [advance, phase, reducedMotion]);

  const cue = phase === 'in' ? 'Breathe in.' : phase === 'out' ? 'Breathe out.' : null;
  const circleMotion = phase === 'in' ? 'bb-breathing-in' : phase === 'out' ? 'bb-breathing-out' : '';

  return (
    <section aria-live="polite" className="flex flex-col items-center text-center">
      <div className="mb-8 flex h-56 items-center justify-center">
        <div
          aria-hidden="true"
          className={`relative h-44 w-44 rounded-full bg-bb-teal shadow-sm ${reducedMotion ? '' : circleMotion}`}
        >
          <EmotionFace
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            emotion="calm"
            size={108}
          />
        </div>
      </div>

      <div className="flex h-16 items-center justify-center">
        {phase === 'idle' ? (
          <BigButton className="min-w-[220px]" onClick={advance}>
            Start breathing
          </BigButton>
        ) : reducedMotion ? (
          <button
            aria-label="Continue breathing"
            className="bb-child-target min-w-[220px] bg-bb-surface px-6 text-[20px] font-extrabold text-bb-teal-deep shadow-sm"
            onClick={advance}
            type="button"
          >
            {cue}
          </button>
        ) : (
          <p className="text-[24px] font-extrabold leading-relaxed text-bb-ink">{cue}</p>
        )}
      </div>
    </section>
  );
}
