import { IWorld, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';

import { GhostBuilding } from '../components/GhostBuilding';
import { Position } from '../components/Position';
import { GameState } from '../scenes/Game';
import { fromPhaserPos, tileSize, toPhaserPos } from '../ui/lib/coordinates';
import { Sprite } from '../components/Sprite';

const ghostBuildingQuery = defineQuery([GhostBuilding, Position]);
export const createBuildingPlacementSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState, _) => {
    const ghostBuildings = ghostBuildingQuery(world);

    for (let i = 0; i < ghostBuildings.length; i++) {
      const width = Sprite.width[ghostBuildings[i]];
      const height = Sprite.height[ghostBuildings[i]];

      const ghostBuilding = ghostBuildings[i];
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
