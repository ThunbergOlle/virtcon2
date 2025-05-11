import { addComponent, addReservedEntity, Entity, removeEntity } from '@virtcon2/bytenetc';
import { ClientPacket, CreateConnectionPointPacket, PacketType } from '@virtcon2/network-packet';
import { ConnectionPoint } from '@virtcon2/network-world-entities';
import Game from '../../../scenes/Game';

export const WorldBuildingConnection = ({ x, y }: { x: number; y: number }) => {
  const onClick = () => {
    const game = Game.getInstance();
    const world = game.state.world;

    const eid = addReservedEntity(world, 2999);

    addComponent(world, ConnectionPoint, eid);
    ConnectionPoint.startX[eid] = x;
    ConnectionPoint.startY[eid] = y;
    ConnectionPoint.endX[eid] = 0;
    ConnectionPoint.endY[eid] = 0;
    ConnectionPoint.valid[eid] = 0;
    ConnectionPoint.followMouse[eid] = 1;

    game.input.on('pointerdown', () => makeConnection(eid));
    game.input.keyboard.once('keydown-ESC', () => cancelConnection(eid));
    game.input.keyboard.once('keydown-Q', () => cancelConnection(eid));

    return () => {
      game.input.off('pointerdown', () => makeConnection(eid));
      game.input.keyboard.off('keydown-ESC', () => cancelConnection(eid));
      game.input.keyboard.off('keydown-Q', () => cancelConnection(eid));
    };
  };
  return (
    <button className="bg-red-500 text-white p-2 rounded-md" onClick={onClick}>
      Connect output
    </button>
  );
};

const makeConnection = (eid: Entity) => {
  if (!ConnectionPoint.valid[eid]) return;

  const [startX, startY, endX, endY] = [
    ConnectionPoint.startX[eid],
    ConnectionPoint.startY[eid],
    ConnectionPoint.endX[eid],
    ConnectionPoint.endY[eid],
  ];

  const packet: ClientPacket<CreateConnectionPointPacket> = {
    packet_type: PacketType.REQUEST_CREATE_CONNECTION_POINT,
    data: {
      startX,
      startY,
      endX,
      endY,
    },
  };
  Game.network.sendPacket(packet);
  cancelConnection(eid);
};

const cancelConnection = (eid: Entity) => {
  const game = Game.getInstance();
  const world = game.state.world;
  removeEntity(world, eid);
};
