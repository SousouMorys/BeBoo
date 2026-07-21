import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BebooMascot } from '../components/BebooMascot';
import { api } from '../lib/api';
import type { Child, Story } from '../lib/types';

interface ShelfModel {
  child: Child;
  stories: Story[];
}

export function Shelf() {
  const navigate = useNavigate();
  const [model, setModel] = useState<ShelfModel | null | undefined>(undefined);

  useEffect(() => {
    let isCurrent = true;

    async function loadShelf() {
      const [child, stories] = await Promise.all([api.getCurrentChild(), api.listStories()]);
      if (isCurrent) {
        setModel(child && api.isOnboardingComplete() ? { child, stories } : null);
      }
    }

    void loadShelf();

    return () => {
      isCurrent = false;
    };
  }, []);

  function openStory(storyId: string) {
    navigate(`/story/${storyId}`);
  }

  if (model === undefined) {
    return (
      <main aria-busy="true" className="min-h-[100dvh] bg-bb-cream px-6 py-10">
        <div className="bb-child-column flex items-center gap-5">
          <BebooMascot expression="calm" />
          <div aria-hidden="true" className="h-16 flex-1 rounded-bb bg-bb-sand" />
        </div>
      </main>
    );
  }

  if (model === null) {
    return <Navigate replace to="/onboarding" />;
  }

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-8 text-bb-ink sm:px-8 sm:py-12">
      <div className="bb-child-column relative">
        <button
          aria-label="Grown-up area"
          className="bb-parent-target absolute right-0 top-0 inline-flex items-center justify-center bg-bb-sand text-bb-ink-soft"
          onClick={() => navigate('/parent/pin')}
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 28 28" width="24">
            <circle cx="10" cy="9" r="3.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="19" cy="11" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M4.5 23C4.5 18.8 7 16.5 10 16.5C13 16.5 15.5 18.8 15.5 23" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            <path d="M15.5 22.5C15.8 19.5 17.5 17.8 20 17.8C22.2 17.8 23.8 19.4 24 22.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </button>
        <header className="mb-9 flex items-center gap-5 pr-14">
          <BebooMascot />
          <div>
            <p className="mb-1 text-[18px] font-bold text-bb-ink-soft">My stories</p>
            <h1 className="m-0 text-[30px] font-extrabold leading-tight sm:text-[36px]">
              Hello, {model.child.firstName}.
            </h1>
          </div>
        </header>

        <button
          className="bb-child-target mb-8 flex w-full items-center gap-4 bg-bb-sand px-5 text-left text-bb-ink shadow-sm"
          onClick={() => navigate('/practice')}
          type="button"
        >
          <BebooMascot expression="calm" size={56} />
          <span className="text-[20px] font-extrabold">Practice</span>
        </button>

        <section aria-label="My stories" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {model.stories.map((story) => (
            <button
              aria-label={`Read ${story.title}`}
              className="bb-child-target overflow-hidden bg-bb-surface text-left shadow-sm"
              key={story.id}
              onClick={() => openStory(story.id)}
              type="button"
            >
              <img alt="" className="aspect-[4/5] w-full object-cover" src={story.coverUrl} />
              <span className="block px-4 py-4 text-[18px] font-extrabold leading-snug text-bb-ink">
                {story.title}
              </span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
