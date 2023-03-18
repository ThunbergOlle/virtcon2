import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.css';
import { events } from './events/Events';
import LobbyPage from './ui/pages/lobby/LobbyPage';
import WorldPage from './ui/pages/world/WorldPage';
import networkError from './ui/errors/network/networkError';

export default function App() {
  useEffect(() => {
    events.subscribe('networkError', ({message, type}) => {
      networkError(message, type);
    });
    return () => {
      events.unsubscribe('networkError', () => {});
    };
  }, []);
  return (
    <div className="App">
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/world/:worldId" element={<WorldPage />} />
          <Route path="*" element={<LobbyPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
