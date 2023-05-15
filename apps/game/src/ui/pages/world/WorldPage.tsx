import { useEffect, useState } from 'react';
import GameConfig from '../../../GameConfig';
import './WorldPage.css';

import { useNavigate, useParams } from 'react-router-dom';

import { WindowManager, WindowStack, WindowType, windowManager } from '../../lib/WindowManager';
import BuildingWindow from '../../windows/building/BuildingWindow';
import PlayerInventoryWindow from '../../windows/playerInventory/PlayerInventory';
import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import MenuWindow from '../../windows/menu/MenuWindow';
import CrafterWindow from '../../windows/crafter/CrafterWindow';

function GamePage() {
  const { worldId } = useParams();
  const [stack, setStack] = useState<WindowStack[]>([]); // A stack contains an array of windows with an index.
  const [game, setGame] = useState<Phaser.Game>();
  const navigate = useNavigate();
  useEffect(() => {
    if (worldId === undefined) {
      navigate('/');
      return;
    }
    // instantiate the game
    const container = document.createElement('div');
    container.id = 'phaser-container';
    document.getElementById('phaser-application')?.appendChild(container);

    const phaserGame = new Phaser.Game(GameConfig);
    setGame(phaserGame);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).game = phaserGame;

    console.log('Joining world', worldId);
    events.notify('joinWorld', worldId);
  }, [worldId]);

  useEffect(() => {
    return () => {
      if (game) {
        console.log('Destroying game');
        Game.destroy();
        game.destroy(false);

        document.getElementById('phaser-container')?.remove();
      }
    };
  }, [game]);
  const openWindow = (windowType: WindowType) => {
    const newStack = windowManager.openWindow(windowType, stack);
    setStack([...newStack]);
  };
  const closeWindow = (windowType: WindowType) => {
    setStack([...windowManager.closeWindow(windowType, stack)]);
  };
  const isOpen = (windowType: WindowType) => {
    return windowManager.isOpen(windowType, stack);
  };
  const selectWindow = (windowType: WindowType) => {
    setStack([...windowManager.selectWindow(windowType, stack)]);
  };
  const getClass = (windowType: WindowType) => {
    return windowManager.getClass(windowType, stack);
  };
  const registerWindow = (windowType: WindowType) => {
    setStack([...windowManager.registerWindow(windowType, stack)]);
  };

  const windowManagerObj: WindowManager = {
    openWindow,
    closeWindow,
    isOpen,
    selectWindow,
    getClass,
    registerWindow,
    stack,
  };
  return (
    <div className="absolute">
      <BuildingWindow windowManager={windowManagerObj}></BuildingWindow>
      <PlayerInventoryWindow windowManager={windowManagerObj}></PlayerInventoryWindow>
      <CrafterWindow windowManager={windowManagerObj}></CrafterWindow>
      <MenuWindow windowManager={windowManagerObj}></MenuWindow>
    </div>
  );
}

export default GamePage;
