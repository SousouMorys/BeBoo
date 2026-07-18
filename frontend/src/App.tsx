import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import type { Child } from './lib/types';
import { DevFaces } from './pages/DevFaces';
import { GenerationProgress } from './pages/parent/GenerationProgress';
import { NewStoryWizard } from './pages/parent/NewStoryWizard';
import { Onboarding } from './pages/parent/Onboarding';
import { ParentHub } from './pages/parent/ParentHub';
import { PinGate } from './pages/parent/PinGate';
import { PracticeBreathe } from './pages/practice/PracticeBreathe';
import { PracticeFeelings } from './pages/practice/PracticeFeelings';
import { PracticeMenu } from './pages/practice/PracticeMenu';
import { PracticeSqueeze } from './pages/practice/PracticeSqueeze';
import { Shelf } from './pages/Shelf';
import { Player } from './pages/player/Player';

interface PracticeGateProps {
  children: (child: Child) => ReactNode;
}

function PracticeGate({ children }: PracticeGateProps) {
  const [child, setChild] = useState<Child | null | undefined>(undefined);

  useEffect(() => {
    let isCurrent = true;
    void api.getCurrentChild().then((currentChild) => {
      if (isCurrent) setChild(currentChild);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  if (child === undefined) {
    return <main aria-busy="true" className="min-h-[100dvh] bg-bb-cream" />;
  }

  if (!child || !api.isOnboardingComplete()) {
    return <Navigate replace to="/onboarding" />;
  }

  return <>{children(child)}</>;
}

function OnboardingRoute() {
  const navigate = useNavigate();

  return <Onboarding onComplete={() => navigate('/', { replace: true })} />;
}

function PinGateRoute() {
  const navigate = useNavigate();

  return (
    <PinGate
      onBack={() => navigate('/')}
      onVerified={() => navigate('/parent', { replace: true })}
    />
  );
}

function ParentHubRoute() {
  const navigate = useNavigate();

  if (!api.isParentUnlocked()) {
    return <Navigate replace to="/parent/pin" />;
  }

  return <ParentHub onExit={() => navigate('/')} onNewStory={() => navigate('/parent/new-story')} />;
}

function NewStoryRoute() {
  const navigate = useNavigate();

  if (!api.isParentUnlocked()) {
    return <Navigate replace to="/parent/pin" />;
  }

  return (
    <NewStoryWizard
      onCancel={() => navigate('/parent')}
      onGenerated={(storyId, request) =>
        navigate(`/parent/generation/${storyId}?category=${encodeURIComponent(request.situation.category)}`, {
          state: request,
        })
      }
    />
  );
}

function GenerationRoute() {
  if (!api.isParentUnlocked()) {
    return <Navigate replace to="/parent/pin" />;
  }

  return <GenerationProgress />;
}

function PracticeMenuRoute() {
  const navigate = useNavigate();

  return (
    <PracticeGate>
      {() => (
        <PracticeMenu
          onBreathe={() => navigate('/practice/breathe')}
          onFeelings={() => navigate('/practice/feelings')}
          onHome={() => navigate('/')}
          onSqueeze={() => navigate('/practice/squeeze')}
        />
      )}
    </PracticeGate>
  );
}

function PracticeFeelingsRoute() {
  const navigate = useNavigate();

  return (
    <PracticeGate>
      {(child) => (
        <PracticeFeelings
          childPrefersReducedMotion={child.settings.reduceAnimations}
          onBack={() => navigate('/practice')}
          onBreathe={() => navigate('/practice/breathe')}
          onRecordFeeling={(emotionId) => {
            void api.recordFeeling({ childId: child.id, emotionId });
          }}
          onSqueeze={() => navigate('/practice/squeeze')}
        />
      )}
    </PracticeGate>
  );
}

function PracticeBreatheRoute() {
  const navigate = useNavigate();

  return (
    <PracticeGate>
      {(child) => (
        <PracticeBreathe
          childPrefersReducedMotion={child.settings.reduceAnimations}
          onBack={() => navigate('/practice')}
        />
      )}
    </PracticeGate>
  );
}

function PracticeSqueezeRoute() {
  const navigate = useNavigate();

  return (
    <PracticeGate>
      {() => <PracticeSqueeze onBack={() => navigate('/practice')} />}
    </PracticeGate>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shelf />} />
      <Route path="/story/:storyId" element={<Player />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/parent/pin" element={<PinGateRoute />} />
      <Route path="/parent" element={<ParentHubRoute />} />
      <Route path="/parent/new-story" element={<NewStoryRoute />} />
      <Route path="/parent/generation/:storyId" element={<GenerationRoute />} />
      <Route path="/practice" element={<PracticeMenuRoute />} />
      <Route path="/practice/feelings" element={<PracticeFeelingsRoute />} />
      <Route path="/practice/breathe" element={<PracticeBreatheRoute />} />
      <Route path="/practice/squeeze" element={<PracticeSqueezeRoute />} />
      <Route path="/dev/faces" element={<DevFaces />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
