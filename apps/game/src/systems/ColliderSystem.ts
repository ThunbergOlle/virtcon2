import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { GameState } from '../scenes/Game';
import { Sprite, Collider, GameObjectGroups } from '@virtcon2/network-world-entities';

export const createColliderSystem = (world: World, scene: Phaser.Scene) => {
  const colliderQuery = defineQuery(Sprite, Collider);
  const colliderQueryEnter = enterQuery(colliderQuery);
  return defineSystem<GameState>((state) => {
    const enterEntities = colliderQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const eid = enterEntities[i];
      const sprite = state.spritesById[eid];
      if (sprite) {
        const collider = scene.physics.add.existing(sprite, Collider(world).static[eid] === 1) as
          | Phaser.Types.Physics.Arcade.SpriteWithStaticBody
          | Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

        collider.body.setSize(Collider(world).sizeWidth[eid], Collider(world).sizeHeight[eid]);
        collider.body.setOffset(Collider(world).offsetX[eid], Collider(world).offsetY[eid]);

        const collisionGroup = state.gameObjectGroups[Collider(world).group[eid] as GameObjectGroups];
        if (collisionGroup) {
          collisionGroup.add(collider);
        }
      } else {
        console.log(`No sprite for entity ${eid}`);
      }
    }

    return state;
  });
};
