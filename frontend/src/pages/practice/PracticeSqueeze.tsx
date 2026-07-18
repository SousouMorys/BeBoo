import { BebooHugsPillow } from '../../components/BebooHugsPillow';
import { PracticeFrame } from './PracticeFrame';

interface PracticeSqueezeProps {
  onBack: () => void;
}

export function PracticeSqueeze({ onBack }: PracticeSqueezeProps) {
  return (
    <PracticeFrame backLabel="Back to Practice" onBack={onBack}>
      <section className="flex flex-1 flex-col items-center justify-center pb-4 text-center">
        <BebooHugsPillow />
        <div className="mt-7 max-w-md space-y-4 text-[21px] font-normal leading-relaxed text-bb-ink">
          <p>You can squeeze your hands together.</p>
          <p>Squeeze slowly. Then open your hands.</p>
          <p>You can hug someone you trust.</p>
          <p>Squeezing helps your body feel calm.</p>
        </div>
      </section>
    </PracticeFrame>
  );
}
