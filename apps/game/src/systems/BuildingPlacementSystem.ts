import { IWorld, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';

import { Collider } from '../components/Collider';
import { GhostBuilding } from '../components/GhostBuilding';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { GameObjectGroups, GameState } from '../scenes/Game';
import { fromPhaserPos, tileSize, toPhaserPos } from '../ui/lib/coordinates';

const ghostBuildingQuery = defineQuery([GhostBuilding, Position, Collider, Sprite]);
const ghostBuildingEnterQuery = enterQuery(ghostBuildingQuery);
export const createBuildingPlacementSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState, _) => {
    const enterEntities = ghostBuildingEnterQuery(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      setupEventListeners(id, state, scene);
    }

    const ghostBuildings = ghostBuildingQuery(world);

    for (let i = 0; i < ghostBuildings.length; i++) {
      const sprite = state.spritesById[ghostBuildings[i]] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      const ghostBuilding = ghostBuildings[i];

      GhostBuilding.placementIsValid[ghostBuilding] = sprite.body.touching.none ? 1 : 0;

      sprite.setTint(sprite.body.touching.none ? 0x00ff00 : 0xff0000);

      const width = Sprite.width[ghostBuilding];
      const height = Sprite.height[ghostBuilding];

      // convert activePointer world coords to tile coords
      const { x, y } = toPhaserPos(fromPhaserPos({ x: scene.input.activePointer.worldX, y: scene.input.activePointer.worldY }));

      /* Calculate correct offset based on width and height */
      const inTilesWidth = Math.floor(width / tileSize);
      const inTilesHeight = Math.floor(height / tileSize);

      const offsetX = ((inTilesWidth + 1) % 2) / 2;
      const offsetY = ((inTilesHeight + 1) % 2) / 2;

      Position.x[ghostBuilding] = x + offsetX * tileSize;
      Position.y[ghostBuilding] = y + offsetY * tileSize;
    }

    return { world, state };
  });
};

const setupEventListeners = (entity: number, state: GameState, scene: Phaser.Scene) => {
  const sprite = state.spritesById[entity];
  if (!sprite) {
    console.error(`No sprite for entity ${entity}`);
    return;
  }
  // make sure the sprite is of type Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  const spriteWithBody = sprite as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  if (!spriteWithBody.body) {
    console.error(`No body for entity ${entity}`);
    return;
  }

  scene.physics.add.collider(spriteWithBody, state.gameObjectGroups[GameObjectGroups.BUILDING] ?? [], () => {
    spriteWithBody.body.touching.none = false;
  });
};
