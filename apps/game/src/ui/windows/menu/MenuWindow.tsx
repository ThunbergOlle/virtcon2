import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { events } from '../../../events/Events';
import Window from '../../components/window/Window';
import { WindowType } from '../../lib/WindowSlice';

export default function MenuWindow() {
  const navigate = useNavigate();

  const leaveWorld = () => {
    navigate('/');
  };
  return (
    <Window title="Menu" width={800} height={800} defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }} windowType={WindowType.VIEW_MENU}>
      <div className="flex flex-col h-full">
        <div className="flex-1 text-center flex flex-col w-[80%] m-auto space-y-5">
          <h2 className="text-2xl ">Menu</h2>
          <button className="btn btn-primary" onClick={leaveWorld}>
            Leave world
          </button>
        </div>
      </div>
    </Window>
  );
}
