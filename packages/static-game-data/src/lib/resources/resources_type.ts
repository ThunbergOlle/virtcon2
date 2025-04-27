import { DBItemName } from '../items/item_type';

export enum ResourceNames {
  WOOD = 'resource_wood',
  STONE = 'resource_stone',
  COAL = 'resource_coal',
  IRON = 'resource_iron',
}

export interface ResourcesType {
  sprite: string;
  item: DBItemName;
  full_health: number;

  width: number;
  height: number;
  spriteWidth?: number;
  spriteHeight?: number;
}

export const Resources: Record<ResourceNames, ResourcesType> = {
  [ResourceNames.WOOD]: {
    item: DBItemName.WOOD,
    sprite: 'resource_wood',
    full_health: 5,

    height: 0.5,
    width: 0.8,
    spriteHeight: 3,
    spriteWidth: 2,
  },
  [ResourceNames.STONE]: {
    item: DBItemName.STONE,
    sprite: 'resource_stone',
    spriteHeight: 1,
    spriteWidth: 1,
    width: 0.5,
    height: 0.5,
    full_health: 5,
  },
  [ResourceNames.COAL]: {
    item: DBItemName.COAL,
    sprite: 'resource_coal',
    spriteHeight: 2,
    spriteWidth: 2,
    width: 1,
    height: 0.5,
    full_health: 5,
  },
  [ResourceNames.IRON]: {
    item: DBItemName.IRON_ORE,
    sprite: 'resource_iron_ore',
    width: 1,
    height: 0.5,
    spriteHeight: 2,
    spriteWidth: 2,
    full_health: 5,
  },
};

export const getResourceNameFromItemName = (item: DBItemName): ResourceNames =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(Resources).find(([_, resource]) => resource.item === item)?.[0] as ResourceNames;
