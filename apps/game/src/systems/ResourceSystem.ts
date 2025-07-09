import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { Collider, Resource, Sprite } from '@virtcon2/network-world-entities';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { Types } from 'phaser';
import Game, { debugMode, GameState } from '../scenes/Game';
import { ClientPacket, PacketType, RequestDestroyResourcePacket } from '@virtcon2/network-packet';

export const createResourceSystem = (world: World) => {
  const game = Game.getInstance();

  const resourceQuery = defineQuery(Resource, Sprite, Collider);
  const resourceEnterQuery = enterQuery(resourceQuery);

  return defineSystem<GameState>((state) => {
    const enterEntities = resourceEnterQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;

      sprite.setName(`resource-${get_item_by_id(Resource(world).itemId[id])?.name}`);
      sprite.disableInteractive();

      if (debugMode() && sprite.body?.gameObject) game.input.enableDebug(sprite.body.gameObject);
    }
    return state;
  });
};

export const damageResource = (world: World, state: GameState, eid: number, damage: number) => {
  Resource(world).health[eid] -= damage;
  if (Resource(world).health[eid] <= 0) {
    const destroyResourcePacket: ClientPacket<RequestDestroyResourcePacket> = {
      data: {
        resourceEntityId: eid,
      },
      packet_type: PacketType.REQUEST_DESTROY_RESOURCE,
      world_id: state.world,
    };

    Game.network.sendPacket(destroyResourcePacket);

    Resource(world).health[eid] = 5;
  }
};
