import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { BigButton } from './BigButton';

type BreathPhase = 'idle' | 'in' | 'out';

interface BreathingCircleProps {
  companion?: ReactNode;
  reducedMotion: boolean;
  onComplete: () => void;
}

/**
 * The shared C2a regulation tool. It has no visible duration or cycle count;
 * a child begins it explicitly, and reduced-motion users advance each cue by tap.
 */
export function BreathingCircle({ companion, reducedMotion, onComplete }: BreathingCircleProps) {
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
      <div className="mb-8 flex items-center justify-center gap-4">
        <div
          aria-hidden="true"
          className={`h-44 w-44 rounded-full bg-bb-teal shadow-sm ${reducedMotion ? '' : circleMotion}`}
        />
        {companion}
      </div>

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
        <p className="min-h-16 text-[24px] font-extrabold leading-relaxed text-bb-ink">{cue}</p>
      )}
    </section>
  );
}
