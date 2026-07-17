import { BigButton } from '../../components/BigButton';
import { KaraokeText } from '../../components/KaraokeText';
import { KenBurnsImage } from '../../components/KenBurnsImage';
import { ProgressDots } from '../../components/ProgressDots';
import { SpeakerButton } from '../../components/SpeakerButton';
import { useNarration } from '../../hooks/useNarration';
import type { StoryPageData } from '../../lib/types';

interface StoryPageProps {
  page: StoryPageData;
  pageIndex: number;
  totalPages: number;
  storyTitle: string;
  playbackRate: number;
  highlighting: boolean;
  reducedMotion: boolean;
  onHome: () => void;
  onNext: () => void;
}

export function StoryPage({
  page,
  pageIndex,
  totalPages,
  storyTitle,
  playbackRate,
  highlighting,
  reducedMotion,
  onHome,
  onNext,
}: StoryPageProps) {
  const narration = useNarration({
    text: page.text,
    timings: page.timings,
    playbackRate,
  });

  function returnToShelf() {
    narration.stop();
    onHome();
  }

  function moveToNextPage() {
    narration.stop();
    onNext();
  }

  return (
    <div className="min-h-[100dvh] bg-bb-cream text-bb-ink">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-bb-sand bg-bb-cream">
        <div className="mx-auto grid h-20 max-w-[560px] grid-cols-[64px_1fr_64px] items-center gap-2 px-3">
          <button
            aria-label="My stories"
            className="bb-child-target inline-flex items-center justify-center bg-bb-surface text-bb-ink shadow-sm"
            onClick={returnToShelf}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 28 28" width="27">
              <path d="M4 13.5L14 5L24 13.5V23H17.5V16H10.5V23H4V13.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </button>
          <ProgressDots activeIndex={pageIndex} total={totalPages} />
          <span aria-label={`Page ${pageIndex + 1} of ${totalPages}`} className="text-right text-[18px] font-extrabold text-bb-ink-soft">
            {pageIndex + 1}/{totalPages}
          </span>
        </div>
      </header>

      <main className="pb-28 pt-20">
        <div className={reducedMotion ? '' : 'bb-page-transition'}>
          <div className="h-[56dvh] min-h-[300px] max-h-[540px] overflow-hidden">
            <KenBurnsImage
              alt={page.scene}
              animation={page.animation}
              imageUrl={page.imageUrl}
              reducedMotion={reducedMotion}
            />
          </div>
          <section aria-label={`${storyTitle}, page ${pageIndex + 1}`} className="relative mx-4 -mt-5 rounded-bb bg-bb-surface px-5 py-6 shadow-sm sm:mx-6 sm:px-7">
            <KaraokeText
              activeWordIndex={highlighting ? narration.activeWordIndex : -1}
              text={page.text}
            />
          </section>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-bb-sand bg-bb-cream">
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-3 px-4 py-3">
          <SpeakerButton
            isComplete={narration.isComplete}
            isPlaying={narration.isPlaying}
            onClick={narration.toggle}
          />
          <BigButton className="min-w-[150px]" onClick={moveToNextPage}>
            <span>Next</span>
            <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 28 28" width="24">
              <path d="M6 14H21M16 8L22 14L16 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </BigButton>
        </div>
      </footer>
    </div>
  );
}
