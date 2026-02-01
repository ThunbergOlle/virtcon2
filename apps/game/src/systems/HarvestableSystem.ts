import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { Collider, Harvestable, Sprite } from '@virtcon2/network-world-entities';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { Types } from 'phaser';
import Game, { debugMode, GameState } from '../scenes/Game';
import { ClientPacket, PacketType, RequestDestroyHarvestablePacket } from '@virtcon2/network-packet';
import { attackClickedResource } from './MainPlayerSystem';

export const createHarvestableSystem = (world: World) => {
  const game = Game.getInstance();

  const harvestableQuery = defineQuery(Harvestable, Sprite, Collider);
  const harvestableEnterQuery = enterQuery(harvestableQuery);

  return defineSystem<GameState>((state) => {
    const enterEntities = harvestableEnterQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;

      sprite.setName(`harvestable-${get_item_by_id(Harvestable(world).itemId[id])?.name}`);

      if (debugMode() && sprite.body?.gameObject) game.input.enableDebug(sprite.body.gameObject);

      sprite.setInteractive(game.input.makePixelPerfect());
      sprite.body.gameObject.on(Phaser.Input.Events.POINTER_DOWN, () => {
        attackClickedResource(state, world, id);
      });
    }
    return state;
  });
};

export const shakeHarvestableSprite = (state: GameState, eid: number) => {
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

export const damageHarvestable = (world: World, state: GameState, eid: number, damage: number) => {
  Harvestable(world).health[eid] -= damage;
  if (Harvestable(world).health[eid] <= 0) {
    const destroyHarvestablePacket: ClientPacket<RequestDestroyHarvestablePacket> = {
      data: {
        harvestableEntityId: eid,
      },
      packet_type: PacketType.REQUEST_DESTROY_HARVESTABLE,
      world_id: state.world,
    };

    Game.network.sendPacket(destroyHarvestablePacket);

    // Reset health to prevent multiple destroy packets
    Harvestable(world).health[eid] = 5;
  }
};
