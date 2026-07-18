import { BebooMascot } from '../../components/BebooMascot';
import { PracticeFrame } from './PracticeFrame';

interface PracticeMenuProps {
  onHome: () => void;
  onFeelings: () => void;
  onBreathe: () => void;
  onSqueeze: () => void;
}

export function PracticeMenu({ onHome, onFeelings, onBreathe, onSqueeze }: PracticeMenuProps) {
  return (
    <PracticeFrame backLabel="My stories" home onBack={onHome}>
      <section className="flex flex-1 flex-col items-center justify-center pb-5 text-center">
        <BebooMascot expression="calm" size={128} />
        <h1 className="mt-7 max-w-sm text-[28px] font-extrabold leading-snug">
          You can practice feeling calm.
        </h1>

        <div className="mt-9 flex w-full flex-col gap-4">
          <button
            className="bb-child-target w-full bg-bb-surface px-6 text-[20px] font-extrabold text-bb-ink shadow-sm"
            onClick={onFeelings}
            type="button"
          >
            How I feel now
          </button>
          <button
            className="bb-child-target w-full bg-bb-sand px-6 text-[20px] font-extrabold text-bb-ink shadow-sm"
            onClick={onBreathe}
            type="button"
          >
            Breathe with BeBoo
          </button>
          <button
            className="bb-child-target w-full bg-bb-surface px-6 text-[20px] font-extrabold text-bb-ink shadow-sm"
            onClick={onSqueeze}
            type="button"
          >
            Squeeze and hug
          </button>
        </div>
      </section>
    </PracticeFrame>
  );
}
