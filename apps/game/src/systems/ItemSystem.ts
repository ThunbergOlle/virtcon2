import { debugEntity, defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import Game, { GameState } from '../scenes/Game';
import { Scene } from 'phaser';
import { Item, MainPlayer, Sprite } from '@virtcon2/network-world-entities';
import { ClientPacket, PacketType, RequestDestroyResourcePacket, RequestPickupItemPacketData } from '@virtcon2/network-packet';

const itemQuery = defineQuery(Item, Sprite);
const mainPlayerQuery = defineQuery(MainPlayer, Sprite);

export const createItemSystem = (world: World, scene: Scene) => {
  return defineSystem<GameState>((state) => {
    const entities = itemQuery(world);
    const mainPlayerEntities = mainPlayerQuery(world);

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
