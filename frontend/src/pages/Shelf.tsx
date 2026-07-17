import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BebooMascot } from '../components/BebooMascot';
import { api } from '../lib/api';
import type { Child, Story } from '../lib/types';

interface ShelfModel {
  child: Child;
  stories: Story[];
}

export function Shelf() {
  const navigate = useNavigate();
  const [model, setModel] = useState<ShelfModel | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadShelf() {
      const [child, stories] = await Promise.all([api.getCurrentChild(), api.listStories()]);
      if (isCurrent) {
        setModel({ child, stories });
      }
    }

    void loadShelf();

    return () => {
      isCurrent = false;
    };
  }, []);

  function openStory(storyId: string) {
    void api.markStoryRead(storyId);
    navigate(`/story/${storyId}`);
  }

  if (!model) {
    return (
      <main aria-busy="true" className="min-h-[100dvh] bg-bb-cream px-6 py-10">
        <div className="mx-auto flex max-w-md items-center gap-5">
          <BebooMascot expression="calm" />
          <div aria-hidden="true" className="h-16 flex-1 rounded-bb bg-bb-sand" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-8 text-bb-ink sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-9 flex items-center gap-5">
          <BebooMascot />
          <div>
            <p className="mb-1 text-[18px] font-bold text-bb-ink-soft">My stories</p>
            <h1 className="m-0 text-[30px] font-extrabold leading-tight sm:text-[36px]">
              Hello, {model.child.firstName}.
            </h1>
          </div>
        </header>

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
