import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.scss';
import { events } from './events/Events';
import LobbyPage from './ui/pages/lobby/LobbyPage';
import WorldPage from './ui/pages/world/WorldPage';
import networkError from './ui/errors/network/networkError';
import { useNavigate } from 'react-router-dom';

export default function App() {
  return (
    <div className="App">
      <ToastContainer />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}
function AppRoutes() {
  const navigate = useNavigate();
  useEffect(() => {
    events.subscribe('networkError', ({ message, type }) => {
      networkError(message, type, navigate);
    });
    return () => {
      events.unsubscribe('networkError', () => {});
    };
  }, []);
  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route path="/world/:worldId" element={<WorldPage />} />
      <Route path="*" element={<LobbyPage />} />
    </Routes>
  );
}
