import { DBItem, getItemByName, Harvestable as HarvestableData, HarvestableType } from '@virtcon2/static-game-data';
import { Collider, Position, Sprite, Harvestable } from '../network-world-entities';

import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { TileCoordinates, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';
import { InvalidInputError } from '@shared';

/**
 * Get the appropriate sprite name for a harvestable based on its age
 */
export const getSpriteForAge = (harvestableInfo: HarvestableType, age: number): string => {
  // Sort states by age descending to find the highest age threshold that the current age meets
  const sortedStates = [...harvestableInfo.states].sort((a, b) => b.age - a.age);

  for (const state of sortedStates) {
    if (age >= state.age) {
      return state.sprite;
    }
  }

  // Fallback to the first state or base sprite
  return harvestableInfo.states[0]?.sprite ?? harvestableInfo.sprite;
};

export const HarvestableEntityComponents = [Position, Sprite, Collider, Harvestable];
export const harvestableEntityComponents = HarvestableEntityComponents;

// age is defined in ticks
export const createNewHarvestableEntity = (
  world: World,
  data: { id: number; pos: TileCoordinates; harvestable: HarvestableType; age: number },
): number => {
  const { harvestable } = data;
  const { x, y } = toPhaserPos({ x: data.pos.x, y: data.pos.y });
  const harvestableEid = addEntity(world);
  const harvestableInfo = HarvestableData[harvestable.name];

  addComponent(world, Position, harvestableEid);
  Position(world).x[harvestableEid] = x;
  Position(world).y[harvestableEid] = y;

  if (harvestableInfo.collider) {
    addComponent(world, Collider, harvestableEid);
    Collider(world).sizeWidth[harvestableEid] = harvestableInfo.width * 16;
    Collider(world).sizeHeight[harvestableEid] = harvestableInfo.height * 16;
    Collider(world).offsetX[harvestableEid] = 0;
    Collider(world).offsetY[harvestableEid] = 0;

    if (harvestableInfo.spriteHeight && harvestableInfo.spriteHeight !== harvestableInfo.height) {
      Collider(world).offsetY[harvestableEid] = (-(harvestableInfo.height - harvestableInfo.spriteHeight) * 16) / 2;
    }
    if (harvestableInfo.spriteWidth && harvestableInfo.spriteWidth !== harvestableInfo.width) {
      Collider(world).offsetX[harvestableEid] = (-(harvestableInfo.width - harvestableInfo.spriteWidth) * 16) / 2;
    }

    Collider(world).static[harvestableEid] = 1;
    Collider(world).group[harvestableEid] = GameObjectGroups.HARVESTABLE;
  }

  addComponent(world, Harvestable, harvestableEid);
  Harvestable(world).id[harvestableEid] = data.id;
  Harvestable(world).health[harvestableEid] = harvestable.full_health;
  Harvestable(world).itemId[harvestableEid] = getItemByName(harvestable.item).id;
  Harvestable(world).dropCount[harvestableEid] = harvestable.defaultDropCount;
  Harvestable(world).dropItemId[harvestableEid] = getItemByName(harvestable.dropItemName).id;
  Harvestable(world).age[harvestableEid] = data.age;

  return harvestableEid;
};
