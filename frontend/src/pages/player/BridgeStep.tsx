import { BebooMascot } from '../../components/BebooMascot';
import { BigButton } from '../../components/BigButton';
import { ProgressDots } from '../../components/ProgressDots';

interface BridgeStepProps {
  question: string;
  pageIndex: number;
  totalPages: number;
  reducedMotion: boolean;
  onHome: () => void;
  onDone: () => void;
}

export function BridgeStep({
  question,
  pageIndex,
  totalPages,
  reducedMotion,
  onHome,
  onDone,
}: BridgeStepProps) {
  const currentPage = Math.min(pageIndex + 1, totalPages);
  const activeIndex = Math.max(0, totalPages - 1);

  return (
    <div className="min-h-[100dvh] bg-bb-cream text-bb-ink">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-bb-sand bg-bb-cream">
        <div className="mx-auto grid h-20 max-w-[560px] grid-cols-[64px_1fr_64px] items-center gap-2 px-3">
          <button
            aria-label="My stories"
            className="bb-child-target inline-flex items-center justify-center bg-bb-surface text-bb-ink shadow-sm"
            onClick={onHome}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 28 28" width="27">
              <path d="M4 13.5L14 5L24 13.5V23H17.5V16H10.5V23H4V13.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </button>
          <ProgressDots activeIndex={activeIndex} total={totalPages} />
          <span aria-label={`Page ${currentPage} of ${totalPages}`} className="text-right text-[18px] font-extrabold text-bb-ink-soft">
            {currentPage}/{totalPages}
          </span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[100dvh] max-w-[560px] items-center px-4 pb-28 pt-24">
        <section className="w-full rounded-bb bg-bb-surface px-6 py-9 text-center shadow-sm">
          <div className="flex justify-center">
            <BebooMascot expression="calm" reducedMotion={reducedMotion} size={128} />
          </div>
          <p className="mt-6 text-[24px] font-extrabold leading-relaxed">{question}</p>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-bb-sand bg-bb-cream">
        <div className="mx-auto flex max-w-[560px] justify-end px-4 py-3">
          <BigButton className="min-w-[150px]" onClick={onDone}>Done</BigButton>
        </div>
      </footer>
    </div>
  );
}
