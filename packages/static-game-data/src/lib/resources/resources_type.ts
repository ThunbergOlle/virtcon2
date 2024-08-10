import { DBItemName } from '../items/item_type';

export enum ResourceNames {
  WOOD_BIG = 'resource_wood_big',
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
  [ResourceNames.WOOD_BIG]: {
    item: DBItemName.WOOD_BIG,
    sprite: 'resource_wood',
    width: 1,
    height: 2,
    full_health: 5,
  },
  [ResourceNames.WOOD]: {
    item: DBItemName.WOOD,
    sprite: 'resource_wood',
    full_health: 5,

    height: 2,
    width: 1,
    spriteHeight: 3,
    spriteWidth: 2,
  },
  [ResourceNames.STONE]: {
    item: DBItemName.STONE,
    sprite: 'resource_stone',
    width: 1,
    height: 1,
    full_health: 5,
  },
  [ResourceNames.COAL]: {
    item: DBItemName.COAL,
    sprite: 'resource_coal',
    spriteHeight: 2,
    spriteWidth: 2,
    width: 1,
    height: 1,
    full_health: 5,
  },
  [ResourceNames.IRON]: {
    item: DBItemName.IRON,
    sprite: 'resource_iron',
    width: 1,
    height: 1,
    spriteHeight: 2,
    spriteWidth: 2,
    full_health: 5,
  },
};

export const getResourceNameFromItemName = (item: DBItemName): ResourceNames =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(Resources).find(([_, resource]) => resource.item === item)?.[0] as ResourceNames;
