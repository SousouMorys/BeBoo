import { useState } from 'react';
import { BebooMascot } from '../../components/BebooMascot';
import { BigButton } from '../../components/BigButton';
import { BreathingCircle } from '../../components/BreathingCircle';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PracticeFrame } from './PracticeFrame';

interface PracticeBreatheProps {
  childPrefersReducedMotion: boolean;
  onBack: () => void;
}

export function PracticeBreathe({ childPrefersReducedMotion, onBack }: PracticeBreatheProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [session, setSession] = useState(0);
  const reducedMotion = useReducedMotion(childPrefersReducedMotion);

  function breatheAgain() {
    setIsComplete(false);
    setSession((current) => current + 1);
  }

  return (
    <PracticeFrame backLabel="Back to Practice" onBack={onBack}>
      <section className="flex flex-1 flex-col items-center justify-center pb-5 text-center">
        <h1 className="text-[28px] font-extrabold">Breathe with BeBoo</h1>

        {isComplete ? (
          <div aria-live="polite" className={reducedMotion ? 'mt-8' : 'bb-page-transition mt-8'}>
            <div className="flex justify-center">
              <BebooMascot expression="calm" size={112} />
            </div>
            <p className="max-w-sm text-[22px] font-extrabold leading-relaxed">
              All done! Breathing helps your body feel calm.
            </p>
            <BigButton className="mt-8 min-w-[220px]" onClick={breatheAgain}>
              Breathe again
            </BigButton>
          </div>
        ) : (
          <div className="mt-8">
            <BreathingCircle
              key={session}
              onComplete={() => setIsComplete(true)}
              reducedMotion={reducedMotion}
            />
          </div>
        )}
      </section>
    </PracticeFrame>
  );
}
