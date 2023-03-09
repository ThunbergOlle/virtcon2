import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LobbyPage from './ui/pages/lobby/LobbyPage';
import WorldPage from './ui/pages/world/WorldPage';
import './App.css';
import { useEffect } from 'react';
import { events } from './events/Events';
import { ToastContainer, toast } from 'react-toastify';

export default function App() {
  useEffect(() => {
    events.subscribe('networkError', (errorMsg) => {
        toast("Network: " + errorMsg, {type: 'error'});
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
          <Route path="*" element={<LobbyPage/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}
