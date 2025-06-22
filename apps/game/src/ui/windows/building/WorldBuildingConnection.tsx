import { addComponent, addReservedEntity, Entity, removeEntity, World } from '@virtcon2/bytenetc';
import { ClientPacket, CreateConnectionPointPacket, PacketType } from '@virtcon2/network-packet';
import { ConnectionPoint } from '@virtcon2/network-world-entities';
import Game from '../../../scenes/Game';

export const WorldBuildingConnection = ({ x, y }: { x: number; y: number }) => {
  const onClick = () => {
    const game = Game.getInstance();
    const world = game.state.world;

    const eid = addReservedEntity(world, 2999);

    addComponent(world, ConnectionPoint, eid);
    ConnectionPoint(world).startX[eid] = x;
    ConnectionPoint(world).startY[eid] = y;
    ConnectionPoint(world).endX[eid] = 0;
    ConnectionPoint(world).endY[eid] = 0;
    ConnectionPoint(world).valid[eid] = 0;
    ConnectionPoint(world).followMouse[eid] = 1;

    game.input.on('pointerdown', () => makeConnection(world, eid));
    game.input.keyboard?.once('keydown-ESC', () => cancelConnection(eid));
    game.input.keyboard?.once('keydown-Q', () => cancelConnection(eid));

    return () => {
      game.input.off('pointerdown', () => makeConnection(world, eid));
      game.input.keyboard?.off('keydown-ESC', () => cancelConnection(eid));
      game.input.keyboard?.off('keydown-Q', () => cancelConnection(eid));
    };
  };
  return (
    <button className="bg-red-500 text-white p-2 rounded-md" onClick={onClick}>
      Connect output
    </button>
  );
};

const makeConnection = (world: World, eid: Entity) => {
  if (!ConnectionPoint(world).valid[eid]) return;

  const [startX, startY, endX, endY] = [
    ConnectionPoint(world).startX[eid],
    ConnectionPoint(world).startY[eid],
    ConnectionPoint(world).endX[eid],
    ConnectionPoint(world).endY[eid],
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
