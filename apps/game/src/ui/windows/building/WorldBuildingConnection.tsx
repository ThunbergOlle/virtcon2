import { addComponent, addReservedEntity, Entity, removeEntity } from '@virtcon2/bytenetc';
import { ConnectionPoint } from '@virtcon2/network-world-entities';
import Game from '../../../scenes/Game';

export const WorldBuildingConnection = ({ x, y }: { x: number; y: number }) => {
  const cancelConnection = (eid: Entity) => {
    const game = Game.getInstance();
    const world = game.state.world;
    removeEntity(world, eid);
  };

  const onClick = () => {
    const game = Game.getInstance();
    const world = game.state.world;

    const eid = addReservedEntity(world, 999);

    addComponent(world, ConnectionPoint, eid);
    ConnectionPoint.startX[eid] = x;
    ConnectionPoint.startY[eid] = y;
    ConnectionPoint.endX[eid] = 0;
    ConnectionPoint.endY[eid] = 0;

    game.input.on('pointerdown', () => {
      alert('IMPLEMENT PLACING CONNECTION POINT');
    });
    game.input!.keyboard.once('keydown-ESC', () => cancelConnection(eid));
    game.input!.keyboard.once('keydown-Q', () => cancelConnection(eid));
  };
  return (
    <button className="bg-red-500 text-white p-2 rounded-md" onClick={onClick}>
      Connect output
    </button>
  );
};
