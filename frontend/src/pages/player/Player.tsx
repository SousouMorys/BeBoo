import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BebooMascot } from '../../components/BebooMascot';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { api } from '../../lib/api';
import type { Child, Story } from '../../lib/types';
import { StoryPage } from './StoryPage';

interface PlayerModel {
  child: Child;
  story: Story;
}

export function Player() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<PlayerModel | null | undefined>(undefined);
  const [pageIndex, setPageIndex] = useState(0);
  const reducedMotion = useReducedMotion(model?.child.settings.reduceAnimations ?? true);

  useEffect(() => {
    let isCurrent = true;
    setModel(undefined);
    setPageIndex(0);

    async function loadStory() {
      const [story, child] = await Promise.all([api.getStory(storyId ?? ''), api.getCurrentChild()]);
      if (isCurrent) {
        setModel(story ? { child, story } : null);
      }
    }

    void loadStory();

    return () => {
      isCurrent = false;
    };
  }, [storyId]);

  if (model === undefined) {
    return (
      <main aria-busy="true" className="flex min-h-[100dvh] items-center justify-center bg-bb-cream">
        <BebooMascot expression="calm" />
      </main>
    );
  }

  if (model === null) {
    return <Navigate replace to="/" />;
  }

  const player = model;
  const currentPage = player.story.pages[pageIndex];

  function goNext() {
    if (pageIndex === player.story.pages.length - 1) {
      navigate('/');
      return;
    }

    setPageIndex((current) => current + 1);
  }

  return (
    <StoryPage
      key={`${player.story.id}-${currentPage.page}`}
      onHome={() => navigate('/')}
      onNext={goNext}
      page={currentPage}
      pageIndex={pageIndex}
      playbackRate={player.child.settings.narrationSpeed}
      reducedMotion={reducedMotion}
      storyTitle={player.story.title}
      totalPages={player.story.pages.length}
    />
  );
}
