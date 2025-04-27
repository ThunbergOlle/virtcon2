import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { Collider, Resource, Sprite } from '@virtcon2/network-world-entities';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { Types } from 'phaser';
import Game, { GameState } from '../scenes/Game';
import { ClientPacket, PacketType, RequestDestroyResourcePacket } from '@virtcon2/network-packet';

const resourceQuery = defineQuery(Resource, Sprite, Collider);
const resourceEnterQuery = enterQuery(resourceQuery);
export const createResourceSystem = (world: World) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = resourceEnterQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;

      sprite.setName(`resource-${get_item_by_id(Resource.itemId[id])?.name}`);
    }
    return state;
  });
};

export const damageResource = (state: GameState, eid: number, damage: number) => {
  Resource.health[eid] -= damage;
  if (Resource.health[eid] <= 0) {
    const destroyResourcePacket: ClientPacket<RequestDestroyResourcePacket> = {
      data: {
        resourceEntityId: eid,
      },
      packet_type: PacketType.REQUEST_DESTROY_RESOURCE,
      world_id: state.world,
    };

    Game.network.sendPacket(destroyResourcePacket);

    Resource.health[eid] = 5;
  }
};
