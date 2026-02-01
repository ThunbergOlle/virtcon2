import { defineQuery, defineSystem, enterQuery, exitQuery, World } from '@virtcon2/bytenetc';
import { Collider, Resource, Sprite } from '@virtcon2/network-world-entities';
import { DBItemName, get_item_by_id } from '@virtcon2/static-game-data';
import { Types } from 'phaser';
import Game, { debugMode, GameState } from '../scenes/Game';
import { ClientPacket, PacketType, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { attackClickedResource } from './MainPlayerSystem';

export const createResourceSystem = (world: World) => {
  const game = Game.getInstance();

  const resourceQuery = defineQuery(Resource, Sprite, Collider);
  const resourceEnterQuery = enterQuery(resourceQuery);
  const resourceExitQuery = exitQuery(resourceQuery);

  return defineSystem<GameState>((state) => {
    const enterEntities = resourceEnterQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;

      sprite.setName(`resource-${get_item_by_id(Resource(world).itemId[id])?.name}`);

      if (debugMode() && sprite.body?.gameObject) game.input.enableDebug(sprite.body.gameObject);

      sprite.setInteractive(game.input.makePixelPerfect());
      sprite.body.gameObject.on(Phaser.Input.Events.POINTER_DOWN, () => {
        attackClickedResource(state, world, id);
      });
    }

    return state;
  });
};

export const shakeResourceSprite = (state: GameState, eid: number) => {
  const sprite = state.spritesById[eid] as Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  if (!sprite || !sprite.scene) return;

  const baseAngle = sprite.angle;
  const swayDirection = Math.random() > 0.5 ? 1 : -1;
  const swayAmount = 3;

  sprite.scene.tweens.add({
    targets: sprite,
    angle: baseAngle + swayDirection * swayAmount,
    duration: 80,
    yoyo: true,
    repeat: 1,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      sprite.setAngle(baseAngle);
    },
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
