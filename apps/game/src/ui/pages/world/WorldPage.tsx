import { useEffect, useState } from 'react';
import GameConfig from '../../../GameConfig';
import './WorldPage.css';

import { useNavigate, useParams } from 'react-router-dom';

import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import WorldBuildingWindow from '../../windows/building/WorldBuildingWindow';
import CrafterWindow from '../../windows/crafter/CrafterWindow';
import PlayerInventoryWindow from '../../windows/playerInventory/PlayerInventory';
import { Hotbar } from '../../components/hotbar/Hotbar';
import ExpandPlotWindow from '../../windows/plot/PlotWindow';
import { deleteWorld } from '@virtcon2/bytenetc';

function GamePage() {
  const { worldId } = useParams();

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
        const worldId = Game.worldId;
        Game.destroy();
        game.destroy(false);
        deleteWorld(worldId);

        document.getElementById('phaser-application')?.remove();
      }
    };
  }, [game]);
  return (
    <>
      <div className="absolute">
        <PlayerInventoryWindow />
        <CrafterWindow />
        <WorldBuildingWindow />
        <ExpandPlotWindow />
      </div>
      <Hotbar />
    </>
  );
}

export default GamePage;
