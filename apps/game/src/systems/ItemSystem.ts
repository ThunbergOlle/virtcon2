import { debugEntity, defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import Game, { GameState } from '../scenes/Game';
import { Scene } from 'phaser';
import { Item, MainPlayer, Position, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { ClientPacket, PacketType, RequestPickupItemPacketData } from '@virtcon2/network-packet';

export const createItemSystem = (world: World, scene: Scene) => {
  const itemQuery = defineQuery(Item, Sprite, Position);
  const itemEnterQuery = enterQuery(itemQuery);
  const mainPlayerQuery = defineQuery(MainPlayer, Sprite);

  return defineSystem<GameState>((state) => {
    const enterEntities = itemEnterQuery(world);
    const entities = itemQuery(world);
    const mainPlayerEntities = mainPlayerQuery(world);

    for (const entity of enterEntities) {
      const itemSprite = state.spritesById[entity] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

      const endX = Position(world).x[entity];
      const endY = Position(world).y[entity];

      const startX = Item(world).droppedFromX[entity];
      const startY = Item(world).droppedFromY[entity];

      itemSprite.setPosition(startX, startY);
      itemSprite.body.enable = false;

      scene.tweens.add({
        targets: itemSprite,
        x: endX - 5,
        y: endY - 15,
        duration: 200,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          Velocity(world).x[entity] = itemSprite.body.velocity.x;
          Velocity(world).y[entity] = itemSprite.body.velocity.y;
          console.log(`Item ${entity} velocity: ${Velocity(world).x[entity]}, ${Velocity(world).y[entity]}`);
        },
        onComplete: () => {
          scene.tweens.add({
            targets: itemSprite,
            y: endY,
            duration: 200,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              itemSprite.body.enable = true;
            },
          });
        },
      });
    }

    for (const entity of entities) {
      for (const mainPlayerEntity of mainPlayerEntities) {
        const itemSprite = state.spritesById[entity] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        const mainPlayerSprite = state.spritesById[mainPlayerEntity] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

        scene.physics.overlap(itemSprite, mainPlayerSprite, () => {
          // optimistic deletion by hide
          itemSprite.destroy();
          const destroyResourcePacket: ClientPacket<RequestPickupItemPacketData> = {
            data: {
              itemEntityId: entity,
            },
            packet_type: PacketType.REQUEST_PICKUP_ITEM,
            world_id: state.world,
          };

          Game.network.sendPacket(destroyResourcePacket);
        });
      }
    }

    return state;
  });
};
