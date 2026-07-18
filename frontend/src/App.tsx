import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import { DevFaces } from './pages/DevFaces';
import { GenerationProgress } from './pages/parent/GenerationProgress';
import { NewStoryWizard } from './pages/parent/NewStoryWizard';
import { Onboarding } from './pages/parent/Onboarding';
import { ParentHub } from './pages/parent/ParentHub';
import { PinGate } from './pages/parent/PinGate';
import { Shelf } from './pages/Shelf';
import { Player } from './pages/player/Player';

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
      <Route path="/dev/faces" element={<DevFaces />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
