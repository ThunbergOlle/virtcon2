import { Collider, GameObjectGroups, GhostHarvestable, Position, Sprite } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { fromPhaserPos, tileSize, toPhaserPos } from '../ui/lib/coordinates';
import { defineQuery, defineSystem, Entity, exitQuery, World } from '@virtcon2/bytenetc';
import { TILE_TYPE } from '@shared';
import { getTileAtPoint } from '@virtcon2/static-game-data';

export const createHarvestablePlacementSystem = (world: World, scene: Phaser.Scene) => {
  const ghostHarvestableQuery = defineQuery(GhostHarvestable, Position, Collider, Sprite);
  const ghostHarvestableExitQuery = exitQuery(ghostHarvestableQuery);
  return defineSystem<GameState>((state) => {
    const ghostHarvestables = ghostHarvestableQuery(world);

    for (let i = 0; i < ghostHarvestables.length; i++) {
      const sprite = state.spritesById[ghostHarvestables[i]] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      const ghostHarvestable = ghostHarvestables[i];
      checkGhostHarvestableCollisions(world, ghostHarvestable, state, scene);

      sprite.setTint(GhostHarvestable(world).placementIsValid[ghostHarvestable] ? 0x00ff00 : 0xff0000);

      // convert activePointer world coords to tile coords
      const { x, y } = toPhaserPos(fromPhaserPos({ x: scene.input.activePointer.worldX, y: scene.input.activePointer.worldY }));

      // Harvestables are always centered on the cursor tile (no offset needed for sub-tile objects)
      Position(world).x[ghostHarvestable] = x;
      Position(world).y[ghostHarvestable] = y;
    }

    const exitEntities = ghostHarvestableExitQuery(world);
    for (let i = 0; i < exitEntities.length; i++) {
      const id = exitEntities[i];
      const ghostHarvestableById = state.ghostHarvestableById[id];
      if (ghostHarvestableById) {
        delete state.ghostHarvestableById[id];
      }
    }
    return state;
  });
};

const checkGhostHarvestableCollisions = (world: World, entity: Entity, state: GameState, scene: Phaser.Scene) => {
  const sprite = state.spritesById[entity];
  GhostHarvestable(world).placementIsValid[entity] = 1;
  if (!sprite) {
    console.error(`No sprite for entity ${entity}`);
    return;
  }
  const spriteWithBody = sprite as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  if (!spriteWithBody.body) {
    console.error(`No body for entity ${entity}`);
    return;
  }

  // Check collisions with buildings
  if (scene.physics.collide(sprite, state.gameObjectGroups[GameObjectGroups.BUILDING] || [])) {
    GhostHarvestable(world).placementIsValid[entity] = 0;
  }

  // Check collisions with resources
  if (scene.physics.collide(sprite, state.gameObjectGroups[GameObjectGroups.RESOURCE] || [])) {
    GhostHarvestable(world).placementIsValid[entity] = 0;
  }

  // Check collisions with existing harvestables
  if (scene.physics.collide(sprite, state.gameObjectGroups[GameObjectGroups.HARVESTABLE] || [])) {
    GhostHarvestable(world).placementIsValid[entity] = 0;
  }

  // Check tile type - harvestables can only be placed on GRASS
  const tilePos = fromPhaserPos({ x: Position(world).x[entity], y: Position(world).y[entity] });
  const tileType = getTileAtPoint(state.worldSeed, tilePos.x, tilePos.y);
  if (tileType !== TILE_TYPE.GRASS) {
    GhostHarvestable(world).placementIsValid[entity] = 0;
  }
};
