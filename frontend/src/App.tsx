import { Navigate, Route, Routes } from 'react-router-dom';
import { Shelf } from './pages/Shelf';
import { Player } from './pages/player/Player';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shelf />} />
      <Route path="/story/:storyId" element={<Player />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
