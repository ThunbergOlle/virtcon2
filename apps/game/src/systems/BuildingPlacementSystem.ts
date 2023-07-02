import { IWorld, defineQuery, defineSystem, enterQuery, exitQuery } from '@virtcon2/virt-bit-ecs';

import { Collider } from '../components/Collider';
import { GhostBuilding } from '../components/GhostBuilding';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { GameObjectGroups, GameState } from '../scenes/Game';
import { fromPhaserPos, tileSize, toPhaserPos } from '../ui/lib/coordinates';
import { DBBuilding } from '@virtcon2/static-game-data';

const ghostBuildingQuery = defineQuery([GhostBuilding, Position, Collider, Sprite]);
const ghostBuildingExitQuery = exitQuery(ghostBuildingQuery);
export const createBuildingPlacementSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState, _) => {
    const ghostBuildings = ghostBuildingQuery(world);

    for (let i = 0; i < ghostBuildings.length; i++) {
      // check collisions
      const sprite = state.spritesById[ghostBuildings[i]] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      const ghostBuilding = ghostBuildings[i];
      checkGhostBuildingCollisions(ghostBuilding, state, scene);

      sprite.setTint(GhostBuilding.placementIsValid[ghostBuilding] ? 0x00ff00 : 0xff0000);

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

    const exitEntities = ghostBuildingExitQuery(world);
    for (let i = 0; i < exitEntities.length; i++) {
      const id = exitEntities[i];
      const ghostBuildingById = state.ghostBuildingById[id];
      if (ghostBuildingById) {
        delete state.ghostBuildingById[id];
      }
    }
    return { world, state };
  });
};
const checkGhostBuildingCollisions = (entity: number, state: GameState, scene: Phaser.Scene) => {
  const sprite = state.spritesById[entity];
  GhostBuilding.placementIsValid[entity] = 1;
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

  if (scene.physics.collide(sprite, state.gameObjectGroups[GameObjectGroups.BUILDING] || [])) {
    GhostBuilding.placementIsValid[entity] = 0;
  }
  const building = state.ghostBuildingById[entity];
  if (!building) {
    console.error(`No building for entity ${entity}`);
    return;
  }
  if (building.item_to_be_placed_on) {
    GhostBuilding.placementIsValid[entity] = 0;
    scene.physics.collide(sprite, state.gameObjectGroups[GameObjectGroups.RESOURCE] || [], (_, collided) => {
      if (collided.name === `resource-${building.item_to_be_placed_on?.name}`) {
        GhostBuilding.placementIsValid[entity] = 1;
      }
    });
  }
};
