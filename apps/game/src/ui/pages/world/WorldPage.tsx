import { useEffect, useMemo, useReducer, useState } from 'react';
import GameConfig from '../../../GameConfig';
import './WorldPage.css';

import { useNavigate, useParams } from 'react-router-dom';

import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import { WindowStackContext, windowStackReducer } from '../../context/window/WindowContext';
import CrafterWindow from '../../windows/crafter/CrafterWindow';
import PlayerInventoryWindow from '../../windows/playerInventory/PlayerInventory';
import WorldBuildingWindow from '../../windows/building/WorldBuildingWindow';

function GamePage() {
  const { worldId } = useParams();

  const [windowStack, setWindowStack] = useReducer(windowStackReducer, []);
  const value = useMemo(() => ({ windowStack, setWindowStack }), [windowStack]);
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
    events.notify('joinWorld', worldId);
  }, [worldId]);

  useEffect(() => {
    return () => {
      if (game) {
        console.log('Destroying game');
        Game.destroy();
        game.destroy(false);

        document.getElementById('phaser-application')?.remove();
      }
    };
  }, [game]);
  return (
    <WindowStackContext.Provider value={value}>
      <div className="absolute">
        <PlayerInventoryWindow />
        <CrafterWindow />
        <WorldBuildingWindow />
      </div>
    </WindowStackContext.Provider>
  );
}

export default GamePage;
