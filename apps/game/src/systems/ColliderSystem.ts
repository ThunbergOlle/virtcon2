import { IWorld, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';
import { GameObjectGroups, GameState } from '../scenes/Game';

import { Collider } from '../components/Collider';
import { Sprite } from '../components/Sprite';

const colliderQuery = defineQuery([Sprite, Collider]);
const colliderQueryEnter = enterQuery(colliderQuery);

export const createColliderSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    const enterEntities = colliderQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const eid = enterEntities[i];
      const sprite = state.spritesById[eid];
      if (sprite) {
        const collider = scene.physics.add.existing(sprite, Collider.static[eid] === 1) as Phaser.Types.Physics.Arcade.SpriteWithStaticBody | Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        collider.body.setSize(Collider.sizeWidth[eid], Collider.sizeHeight[eid]);
        collider.body.setOffset(Collider.offsetX[eid], Collider.offsetY[eid]);
        collider.setScale(Collider.scale[eid] || 1);
        sprite.setInteractive();
        const collisionGroup = state.gameObjectGroups[Collider.group[eid] as GameObjectGroups];
        if (collisionGroup) {
          collisionGroup.add(collider);
        }
      } else {
        console.log(`No sprite for entity ${eid}`);
      }
    }

    return { world, state };
  });
};
