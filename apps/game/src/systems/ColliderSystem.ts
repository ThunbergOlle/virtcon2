import { IWorld, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';
import { GameState } from '../scenes/Game';

import { Collider } from '../components/Collider';
import { Player } from '../components/Player';
import { Sprite } from '../components/Sprite';

const playerQuery = defineQuery([Sprite, Player, Collider]);
const playerQueryEnter = enterQuery(playerQuery);

const colliderQuery = defineQuery([Sprite, Collider]);
const colliderQueryEnter = enterQuery(colliderQuery);

export const createColliderSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    const enterEntities = colliderQueryEnter(world);
    const playerEntities = playerQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const eid = enterEntities[i];
      const sprite = state.spritesById[eid];
      if (sprite) {
        const collider = scene.physics.add.existing(sprite) as Phaser.Physics.Arcade.Sprite;
        collider.body.setSize(Collider.sizeWidth[eid], Collider.sizeHeight[eid]);
        collider.body.setOffset(Collider.offsetX[eid], Collider.offsetY[eid]);
        collider.setScale(Collider.scale[eid] || 1);
        // add collide with player
        for (let j = 0; j < playerEntities.length; j++) {
          const playerEntityId = playerEntities[j];
          scene.physics.add.collider(state.spritesById[playerEntityId], sprite);
          sprite.setInteractive()
        }
      } else {
        console.log(`No sprite for entity ${eid}`);
      }
    }

    /* Handle if players are added after the colliders have already been created */
    const playerEnterEntities = playerQueryEnter(world);
    const entities = colliderQuery(world);
    for (let i = 0; i < playerEnterEntities.length; i++) {
      const playerEntityId = playerEnterEntities[i];
      const playerSprite = state.spritesById[playerEntityId];
      for (let j = 0; j < entities.length; j++) {
        const eid = entities[j];
        const sprite = state.spritesById[eid];
        if (sprite) {
          scene.physics.add.collider(playerSprite, sprite);
        }
      }
    }

    return { world, state };
  });
};
