import { useState } from 'react';
import { BebooMascot } from '../../components/BebooMascot';
import { BigButton } from '../../components/BigButton';
import { EmotionFace } from '../../components/EmotionFace';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { emotionIds, type EmotionId } from '../../lib/types';
import { PracticeFrame } from './PracticeFrame';

interface FeelingCopy {
  first: string;
  second: string;
}

const feelingCopy: Record<EmotionId, FeelingCopy> = {
  happy: {
    first: 'You feel happy. That is good!',
    second: 'You can practice breathing now.',
  },
  calm: {
    first: 'You feel calm. That is good.',
    second: 'You can practice breathing now.',
  },
  proud: {
    first: 'You feel proud. That is good.',
    second: 'You can practice breathing now.',
  },
  sad: {
    first: 'You feel sad. That is okay.',
    second: 'Breathing can help. Squeezing can help.',
  },
  angry: {
    first: 'You feel angry. That is okay.',
    second: 'Breathing can help. Squeezing can help.',
  },
  scared: {
    first: 'You feel scared. That is okay.',
    second: 'Breathing can help. Squeezing can help.',
  },
  nervous: {
    first: 'You feel nervous. That is okay.',
    second: 'Breathing can help. Squeezing can help.',
  },
  disappointed: {
    first: 'You feel disappointed. That is okay.',
    second: 'Breathing can help. Squeezing can help.',
  },
};

interface PracticeFeelingsProps {
  childPrefersReducedMotion: boolean;
  onBack: () => void;
  onBreathe: () => void;
  onRecordFeeling: (emotionId: EmotionId) => Promise<void> | void;
  onSqueeze: () => void;
}

export function PracticeFeelings({
  childPrefersReducedMotion,
  onBack,
  onBreathe,
  onRecordFeeling,
  onSqueeze,
}: PracticeFeelingsProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId | null>(null);
  const reducedMotion = useReducedMotion(childPrefersReducedMotion);
  const selectedCopy = selectedEmotion ? feelingCopy[selectedEmotion] : null;

  function chooseEmotion(emotionId: EmotionId) {
    if (selectedEmotion) {
      return;
    }

    // Self-report persists in the background. The child receives the same warm state if it cannot save.
    void Promise.resolve(onRecordFeeling(emotionId)).catch(() => undefined);
    setSelectedEmotion(emotionId);
  }

  return (
    <PracticeFrame backLabel="Back to Practice" onBack={onBack}>
      {selectedEmotion && selectedCopy ? (
        <section
          aria-live="polite"
          className={`${reducedMotion ? '' : 'bb-page-transition'} flex flex-1 flex-col items-center justify-center text-center`}
        >
          <BebooMascot
            action="nod"
            expression={selectedEmotion}
            reducedMotion={reducedMotion}
            size={128}
          />
          <p className="mt-7 text-[26px] font-extrabold leading-relaxed text-bb-ink">{selectedCopy.first}</p>
          <p className="mt-4 text-[20px] font-bold leading-relaxed text-bb-ink-soft">{selectedCopy.second}</p>
        </section>
      ) : (
        <section className="flex flex-1 flex-col justify-center">
          <h1 className="text-center text-[28px] font-extrabold leading-snug">How do you feel now?</h1>
          <div aria-label="Choose how you feel" className="mt-8 grid grid-cols-2 gap-4" role="group">
            {emotionIds.map((emotionId) => (
              <button
                aria-label={emotionId}
                className="bb-child-target flex min-h-[132px] flex-col items-center justify-center gap-1 border-2 border-transparent bg-bb-surface px-2 text-[18px] font-extrabold lowercase shadow-sm"
                key={emotionId}
                onClick={() => chooseEmotion(emotionId)}
                type="button"
              >
                <EmotionFace emotion={emotionId} size={72} />
                <span>{emotionId}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedEmotion ? (
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-bb-sand bg-bb-cream">
          <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-3 px-4 py-3">
            <BigButton className="min-w-0 px-3 text-[18px]" onClick={onBreathe}>
              Breathe with BeBoo
            </BigButton>
            <button
              className="bb-child-target min-w-0 bg-bb-sand px-3 text-[18px] font-extrabold text-bb-ink shadow-sm"
              onClick={onSqueeze}
              type="button"
            >
              Squeeze and hug
            </button>
          </div>
        </footer>
      ) : null}
    </PracticeFrame>
  );
}
