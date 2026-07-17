import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BebooMascot } from '../../components/BebooMascot';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { api } from '../../lib/api';
import type { Child, Story } from '../../lib/types';
import { BridgeStep } from './BridgeStep';
import { CheckInStep } from './CheckInStep';
import { EndingStep } from './EndingStep';
import { StoryPage } from './StoryPage';

interface PlayerModel {
  child: Child;
  story: Story;
}

type PlayerStep =
  | { kind: 'page'; pageIndex: number }
  | { kind: 'check-in'; pageIndex: number }
  | { kind: 'bridge' }
  | { kind: 'ending' };

function makeFlow(story: Story, checkInsEnabled: boolean): PlayerStep[] {
  const flow: PlayerStep[] = [];

  story.pages.forEach((page, pageIndex) => {
    flow.push({ kind: 'page', pageIndex });
    if (checkInsEnabled && page.checkIn) {
      flow.push({ kind: 'check-in', pageIndex });
    }
  });

  flow.push({ kind: 'bridge' }, { kind: 'ending' });
  return flow;
}

export function Player() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<PlayerModel | null | undefined>(undefined);
  const [flowIndex, setFlowIndex] = useState(0);
  const reducedMotion = useReducedMotion(model?.child.settings.reduceAnimations ?? true);

  useEffect(() => {
    let isCurrent = true;
    setModel(undefined);
    setFlowIndex(0);

    async function loadStory() {
      const [story, child] = await Promise.all([api.getStory(storyId ?? ''), api.getCurrentChild()]);
      if (isCurrent) {
        setModel(story && child && api.isOnboardingComplete() ? { child, story } : null);
      }
    }

    void loadStory();

    return () => {
      isCurrent = false;
    };
  }, [storyId]);

  const flow = useMemo(
    () => (model ? makeFlow(model.story, model.child.settings.checkIns) : []),
    [model],
  );

  if (model === undefined) {
    return (
      <main aria-busy="true" className="flex min-h-[100dvh] items-center justify-center bg-bb-cream">
        <BebooMascot expression="calm" />
      </main>
    );
  }

  if (model === null) {
    return <Navigate replace to="/onboarding" />;
  }

  const player = model;
  const step = flow[flowIndex] ?? flow[0];

  function goToNextStep() {
    setFlowIndex((current) => Math.min(current + 1, flow.length - 1));
  }

  function goHome() {
    navigate('/');
  }

  if (step.kind === 'page') {
    const page = player.story.pages[step.pageIndex];

    return (
      <StoryPage
        key={`page-${player.story.id}-${page.page}`}
        highlighting={player.child.settings.highlighting}
        onHome={goHome}
        onNext={goToNextStep}
        page={page}
        pageIndex={step.pageIndex}
        playbackRate={player.child.settings.narrationSpeed}
        reducedMotion={reducedMotion}
        storyTitle={player.story.title}
        totalPages={player.story.pages.length}
      />
    );
  }

  if (step.kind === 'check-in') {
    const page = player.story.pages[step.pageIndex];

    return (
      <div className={reducedMotion ? '' : 'bb-page-transition'} key={`check-in-${page.page}`}>
        <CheckInStep
          childId={player.child.id}
          childName={player.story.childProfile.name}
          onAttempt={api.recordCheckIn}
          onHome={goHome}
          onNext={goToNextStep}
          page={page}
          pageIndex={step.pageIndex}
          reducedMotion={reducedMotion}
          storyId={player.story.id}
          totalPages={player.story.pages.length}
        />
      </div>
    );
  }

  if (step.kind === 'bridge') {
    return (
      <div className={reducedMotion ? '' : 'bb-page-transition'} key="bridge">
        <BridgeStep
          onDone={goToNextStep}
          onHome={goHome}
          pageIndex={player.story.pages.length - 1}
          question={player.story.bridgeQuestion}
          reducedMotion={reducedMotion}
          totalPages={player.story.pages.length}
        />
      </div>
    );
  }

  return (
    <div className={reducedMotion ? '' : 'bb-page-transition'} key="ending">
      <EndingStep
        onReadAgain={() => setFlowIndex(0)}
        onStories={goHome}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
