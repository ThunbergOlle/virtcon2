import { defineQuery, defineSystem, World } from '@virtcon2/bytenetc';
import { ConveyorItem, Item, Position, Sprite } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';

const INTERPOLATION_FACTOR = 0.3;

export const createConveyorItemInterpolationSystem = (world: World) => {
  const conveyorItemQuery = defineQuery(Item, ConveyorItem, Position, Sprite);

  return defineSystem<GameState>((state) => {
    const entities = conveyorItemQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const sprite = state.spritesById[eid] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

      if (!sprite) continue;

      // Get target position from ECS
      const targetX = Position(world).x[eid];
      const targetY = Position(world).y[eid];

      // Smoothly interpolate sprite position toward ECS position
      const currentX = sprite.x;
      const currentY = sprite.y;

      const newX = Phaser.Math.Linear(currentX, targetX, INTERPOLATION_FACTOR);
      const newY = Phaser.Math.Linear(currentY, targetY, INTERPOLATION_FACTOR);

      sprite.setPosition(newX, newY);
      sprite.setDepth(Sprite(world).depth[eid] + newY);
    }

    return state;
  });
};
