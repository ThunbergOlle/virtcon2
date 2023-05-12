import { IWorld, Not, addComponent, addEntity, defineQuery, defineSystem, removeEntity } from '@virtcon2/virt-bit-ecs';
import { GameState } from '../scenes/Game';
import { MainPlayer } from '../components/MainPlayer';

import { Player } from '../components/Player';
import { Position } from '../components/Position';
import { filterPacket } from '../networking/Filters';
import { DisconnectPacketData, JoinPacketData, NetworkPacketData, PacketType, PlayerMovePacketData } from '@virtcon2/network-packet';
import { Velocity } from '../components/Velocity';
import { Sprite } from '../components/Sprite';

const playerNetworkQuery = defineQuery([Not(MainPlayer), Position, Player]);
const mainPlayerQuery = defineQuery([MainPlayer, Position, Player]);

export const createPlayerReceiveNetworkSystem = () => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    const entities = playerNetworkQuery(world);

    /* Handle join / leave packets in seperate functions */
    handleJoinPackets(world, state, packets);
    handleDisconnectPackets(world, state, packets, entities);

    const movementPackets = filterPacket<PlayerMovePacketData>(packets, PacketType.PLAYER_SET_POSITION);
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      /* Handle movement packet */
      const player_id = state.playerById[id];
      if (movementPackets.length > 0) {
        const packet = movementPackets.filter((packet) => packet.data.player_id === player_id)[movementPackets.length - 1];
        if (!packet) continue;
        Position.x[id] = packet.data.position[0];
        Position.y[id] = packet.data.position[1];
      }
    }
    return { world, state };
  });
};

export const createNewPlayerEntity = (joinPacket: JoinPacketData, world: IWorld, state: GameState) => {
  const player = addEntity(world);
  addComponent(world, Position, player);
  Position.x[player] = joinPacket.position[0];
  Position.y[player] = joinPacket.position[1];
  addComponent(world, Sprite, player);
  Sprite.texture[player] = 0;
  addComponent(world, Player, player);
  state.playerById[player] = joinPacket.id;
  Player.player[player] = player;
};

export const handleJoinPackets = (world: IWorld, state: GameState, packets: NetworkPacketData<unknown>[]) => {
  const mainPlayerEntities = mainPlayerQuery(world);
  const joinPackets = filterPacket<JoinPacketData>(packets, PacketType.JOIN);
  /* Handle join packets. */
  for (let i = 0; i < joinPackets.length; i++) {
    if (state.playerById[mainPlayerEntities[0]] !== joinPackets[i].data.id) {
      createNewPlayerEntity(joinPackets[i].data, world, state);
    }
  }
};
export const handleDisconnectPackets = (world: IWorld, state: GameState, packets: NetworkPacketData<unknown>[], entities: number[]) => {
  const disconnectPackets = filterPacket<DisconnectPacketData>(packets, PacketType.DISCONNECT);
  /* Handle disconnect packets. */
  for (let i = 0; i < disconnectPackets.length; i++) {
    const entity = entities.filter((entity) => state.playerById[entity] === disconnectPackets[i].data.id)[0];
    if (entity) {
      delete state.playerById[entity];
      removeEntity(world, entity);
    }
  }
};
