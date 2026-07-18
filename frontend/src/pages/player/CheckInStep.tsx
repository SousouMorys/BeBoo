import { useEffect, useRef, useState } from 'react';
import { BebooMascot } from '../../components/BebooMascot';
import { BigButton } from '../../components/BigButton';
import { EmotionFace } from '../../components/EmotionFace';
import { ProgressDots } from '../../components/ProgressDots';
import type { CheckInAttemptInput, EmotionId, StoryPageData } from '../../lib/types';

interface CheckInStepProps {
  storyId: string;
  childId: string;
  childName: string;
  page: StoryPageData;
  pageIndex: number;
  totalPages: number;
  reducedMotion: boolean;
  onHome: () => void;
  onNext: () => void;
  onAttempt: (attempt: CheckInAttemptInput) => Promise<void> | void;
}

type FeedbackState = 'idle' | 'scaffold' | 'correct' | 'reveal';

export function CheckInStep({
  storyId,
  childId,
  childName,
  page,
  pageIndex,
  totalPages,
  reducedMotion,
  onHome,
  onNext,
  onAttempt,
}: CheckInStepProps) {
  const checkIn = page.checkIn;
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [lockedEmotionIds, setLockedEmotionIds] = useState<EmotionId[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const requestInFlight = useRef(false);

  useEffect(() => {
    setFeedback('idle');
    setLockedEmotionIds([]);
    setSelectedEmotion(null);
    setAttemptCount(0);
    setIsRecording(false);
    requestInFlight.current = false;
  }, [storyId, page.page]);

  if (!checkIn) {
    return null;
  }

  const correctEmotionId = checkIn.correctId;
  const isResolved = feedback === 'correct' || feedback === 'reveal';
  const feedbackText = feedback === 'correct'
    ? `Yes. ${childName} feels ${checkIn.correctId}.`
    : feedback === 'scaffold'
      ? checkIn.scaffold
      : feedback === 'reveal'
        ? checkIn.reveal
        : null;

  async function chooseEmotion(emotionId: EmotionId) {
    if (requestInFlight.current || isResolved || lockedEmotionIds.includes(emotionId)) {
      return;
    }

    const correct = emotionId === correctEmotionId;
    const nextAttempt = attemptCount === 0 ? 1 : 2;
    requestInFlight.current = true;
    setIsRecording(true);

    try {
      await onAttempt({
        storyId,
        page: page.page,
        childId,
        emotionId,
        correct,
        attempt: nextAttempt,
      });
    } finally {
      requestInFlight.current = false;
      setIsRecording(false);
      setAttemptCount(nextAttempt);
      setSelectedEmotion(emotionId);

      if (correct) {
        setFeedback('correct');
      } else {
        const nextLockedEmotionIds = [...lockedEmotionIds, emotionId];
        setLockedEmotionIds(nextLockedEmotionIds);
        setFeedback(nextLockedEmotionIds.length === 2 ? 'reveal' : 'scaffold');

        if (nextLockedEmotionIds.length === 2) {
          setSelectedEmotion(correctEmotionId);
        }
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-bb-cream text-bb-ink">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-bb-sand bg-bb-cream">
        <div className="bb-child-column grid h-20 grid-cols-[64px_1fr_64px] items-center gap-2 px-3">
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
          <ProgressDots activeIndex={pageIndex} total={totalPages} />
          <span aria-label={`Page ${pageIndex + 1} of ${totalPages}`} className="text-right text-[18px] font-extrabold text-bb-ink-soft">
            {pageIndex + 1}/{totalPages}
          </span>
        </div>
      </header>

      <main className="bb-child-column flex min-h-[100dvh] flex-col px-4 pb-28 pt-24">
        <section
          aria-label={`Check-in for page ${pageIndex + 1}`}
          className="rounded-bb bg-bb-surface px-4 py-6 shadow-sm sm:px-6"
        >
          <div className="flex items-center gap-4">
            <img
              alt={`A story scene for ${childName}`}
              className="h-24 w-28 shrink-0 rounded-bb object-cover"
              src={page.imageUrl}
            />
            <p className="text-[22px] font-extrabold leading-relaxed">{checkIn.question}</p>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2" role="group" aria-label="Choose an emotion">
            {checkIn.options.map((option) => {
              const isLocked = lockedEmotionIds.includes(option.id);
              const isHighlighted = (feedback === 'correct' && selectedEmotion === option.id)
                || (feedback === 'reveal' && checkIn.correctId === option.id);
              const isDisabled = isRecording || isLocked || isResolved;

              return (
                <button
                  aria-pressed={isHighlighted}
                  className={`bb-child-target flex min-h-[144px] flex-col items-center justify-center gap-1 border-2 px-1 text-[18px] font-extrabold lowercase ${isHighlighted ? `${reducedMotion ? '' : 'bb-success-glow '}border-bb-teal-deep bg-bb-highlight` : 'border-transparent bg-bb-cream'} ${isLocked ? 'opacity-50' : ''} ${reducedMotion ? '' : 'transition duration-200 ease-out'}`}
                  disabled={isDisabled}
                  key={option.id}
                  onClick={() => void chooseEmotion(option.id)}
                  type="button"
                >
                  <EmotionFace emotion={option.id} size={72} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {feedbackText && (
            <div aria-live="polite" className="mt-6 flex items-center gap-3 rounded-bb bg-bb-sand px-4 py-3">
              {feedback === 'correct' && (
                <BebooMascot action="nod" expression="happy" reducedMotion={reducedMotion} size={68} />
              )}
              {feedback === 'reveal' && <BebooMascot expression="calm" size={68} />}
              <p className="text-[18px] font-bold leading-relaxed text-bb-ink">{feedbackText}</p>
            </div>
          )}
        </section>
      </main>

      {isResolved && (
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-bb-sand bg-bb-cream">
          <div className="bb-child-column flex items-center justify-between gap-3 px-4 py-3">
            <div aria-hidden="true" className="h-16 w-[158px]" />
            <BigButton className="min-w-[150px]" onClick={onNext}>
              <span>Next</span>
              <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 28 28" width="24">
                <path d="M6 14H21M16 8L22 14L16 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            </BigButton>
          </div>
        </footer>
      )}
    </div>
  );
}
