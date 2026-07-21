import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BebooMascot } from '../../components/BebooMascot';
import { api } from '../../lib/api';
import type { SituationCategory, StoryGenerationInput, StoryStatus } from '../../lib/types';

const steps: Array<{ id: Exclude<StoryStatus, 'ready' | 'failed'>; label: string }> = [
  { id: 'writing', label: 'Writing your story…' },
  { id: 'drawing', label: 'Drawing the pictures…' },
  { id: 'voicing', label: 'Recording the voice.' },
];

function isSituationCategory(value: string | null): value is SituationCategory {
  return value === 'health' || value === 'school' || value === 'daily-life' || value === 'social' || value === 'custom';
}

function isGenerationRequest(value: unknown): value is StoryGenerationInput {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const request = value as Partial<StoryGenerationInput>;
  return typeof request.childId === 'string' && typeof request.length === 'number' && typeof request.checkIns === 'boolean' && Boolean(request.situation);
}

export function GenerationProgress() {
  const { storyId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<StoryStatus>('writing');
  const [isRetrying, setIsRetrying] = useState(false);
  const categoryParam = searchParams.get('category');
  const category: SituationCategory = isSituationCategory(categoryParam) ? categoryParam : 'custom';
  const request = isGenerationRequest(location.state) ? location.state : undefined;

  useEffect(() => {
    if (!storyId) {
      navigate('/parent', { replace: true });
      return undefined;
    }

    let isCurrent = true;
    let timer: number | undefined;

    async function pollStatus() {
      try {
        const nextStatus = await api.getStoryStatus(storyId);
        if (!isCurrent) {
          return;
        }

        setStatus(nextStatus);
        if (nextStatus === 'ready') {
          navigate('/parent', { replace: true });
          return;
        }
        if (nextStatus === 'failed') {
          return;
        }
      } catch {
        // A transient connection issue should not replace the calm progress state.
      }

      if (isCurrent) {
        timer = window.setTimeout(() => void pollStatus(), 2500);
      }
    }

    void pollStatus();
    return () => {
      isCurrent = false;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [navigate, storyId]);

  async function tryAgain() {
    if (!request) {
      navigate(`/parent/new-story?category=${encodeURIComponent(category)}`);
      return;
    }

    setIsRetrying(true);
    try {
      const nextStoryId = await api.generateStory(request);
      navigate(`/parent/generation/${nextStoryId}?category=${encodeURIComponent(category)}`, {
        replace: true,
        state: request,
      });
    } catch {
      setIsRetrying(false);
    }
  }

  async function readFallbackStory() {
    const fallback = await api.getFallbackSeedStory(category);
    navigate(`/story/${fallback.id}`);
  }

  if (status === 'failed') {
    return (
      <main className="min-h-[100dvh] bg-bb-cream px-5 py-10 text-bb-ink sm:px-8">
        <section className="mx-auto max-w-xl rounded-bb-lg bg-bb-surface p-7 text-center shadow-sm sm:p-10">
          <div className="flex justify-center"><BebooMascot expression="calm" /></div>
          <h1 className="mt-6 text-[30px] font-extrabold leading-tight">Story generation paused</h1>
          <p className="mt-4 rounded-bb bg-bb-sand px-4 py-3 text-[18px] leading-relaxed text-bb-ink-soft">We couldn't finish this story. Try again.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button className="bb-parent-target bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface disabled:opacity-50" disabled={isRetrying} onClick={() => void tryAgain()} type="button">{isRetrying ? 'Starting story' : 'Try again'}</button>
            <button className="bb-parent-target border-2 border-bb-sand bg-bb-surface px-5 text-[16px] font-extrabold text-bb-teal-deep" onClick={() => void readFallbackStory()} type="button">Read a story from the shelf</button>
          </div>
        </section>
      </main>
    );
  }

  const activeIndex = Math.max(0, steps.findIndex((item) => item.id === status));

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-10 text-bb-ink sm:px-8">
      <section aria-live="polite" className="mx-auto max-w-xl rounded-bb-lg bg-bb-surface p-7 text-center shadow-sm sm:p-10">
        <div className="flex justify-center"><BebooMascot expression="calm" /></div>
        <p className="mt-6 text-[16px] font-bold text-bb-ink-soft">BeBoo is making a calm story.</p>
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight">Getting it ready</h1>
        <ol className="mt-8 grid list-none gap-3 p-0 text-left">
          {steps.map((item, index) => {
            const isComplete = index < activeIndex;
            const isActive = index === activeIndex;
            return (
              <li
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-3 rounded-bb border-2 px-4 py-3 text-[18px] font-extrabold ${isActive ? 'border-bb-teal-deep bg-bb-sand text-bb-ink' : isComplete ? 'border-bb-teal bg-bb-surface text-bb-teal-deep' : 'border-bb-sand bg-bb-cream text-bb-ink-soft'}`}
                key={item.id}
              >
                <div aria-hidden="true">
                  <BebooMascot expression={isActive ? 'happy' : 'calm'} size={44} />
                </div>
                <span>{isComplete ? 'Done: ' : ''}{item.label}</span>
              </li>
            );
          })}
        </ol>
        <p className="mb-0 mt-7 text-[16px] leading-relaxed text-bb-ink-soft">This page updates as each step finishes.</p>
      </section>
    </main>
  );
}
