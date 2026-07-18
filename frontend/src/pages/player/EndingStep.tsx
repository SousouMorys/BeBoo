import { BebooMascot } from '../../components/BebooMascot';
import { BigButton } from '../../components/BigButton';

interface EndingStepProps {
  reducedMotion: boolean;
  onReadAgain: () => void;
  onStories: () => void;
}

export function EndingStep({ reducedMotion, onReadAgain, onStories }: EndingStepProps) {
  return (
    <div className="min-h-[100dvh] bg-bb-cream text-bb-ink">
      <main className="bb-child-column flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-28 text-center">
        <BebooMascot action="wave" expression="happy" reducedMotion={reducedMotion} size={144} />
        <h1 className="mt-7 text-[32px] font-extrabold">The end.</h1>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-bb-sand bg-bb-cream">
        <div className="bb-child-column grid grid-cols-2 gap-3 px-4 py-3">
          <BigButton className="min-w-0 px-3 text-[18px]" onClick={onReadAgain}>Read again</BigButton>
          <button
            className="bb-child-target min-w-0 bg-bb-sand px-3 text-[18px] font-extrabold text-bb-ink shadow-sm"
            onClick={onStories}
            type="button"
          >
            My stories
          </button>
        </div>
      </footer>
    </div>
  );
}
