import { DBItemName } from '../items/item_type';

export enum ResourceNames {
  WOOD = 'resource_wood',
  STONE = 'resource_stone',
  COAL = 'resource_coal',
  IRON = 'resource_iron',
}

export interface ResourcesType {
  name: ResourceNames;
  sprite: string;
  item: DBItemName;
  full_health: number;
  infinite: boolean;
  dropCount: number;
  layer: 'ground' | 'underground';
  spawnSettings: {
    minHeight: number;
    maxHeight: number;
    chance: number;
  };
  width: number;
  height: number;
  spriteWidth?: number;
  spriteHeight?: number;
}

export const Resources: Record<ResourceNames, ResourcesType> = {
  [ResourceNames.WOOD]: {
    name: ResourceNames.WOOD,
    infinite: false,
    dropCount: 50,
    layer: 'ground',
    spawnSettings: {
      minHeight: 0.2,
      maxHeight: 0.8,
      chance: 0.5,
    },
    item: DBItemName.WOOD,
    sprite: 'resource_wood',
    full_health: 5,
    height: 0.5,
    width: 0.8,
    spriteHeight: 3,
    spriteWidth: 2,
  },
  [ResourceNames.STONE]: {
    name: ResourceNames.STONE,
    infinite: true,
    dropCount: 1,
    layer: 'underground',
    spawnSettings: {
      minHeight: 0.15,
      maxHeight: 0.45,
      chance: 0.12,
    },
    item: DBItemName.STONE,
    sprite: 'resource_stone',
    spriteHeight: 1,
    spriteWidth: 1,
    width: 0.5,
    height: 0.5,
    full_health: 5,
  },
  [ResourceNames.COAL]: {
    name: ResourceNames.COAL,
    infinite: true,
    dropCount: 1,
    layer: 'underground',
    spawnSettings: {
      minHeight: 0.2,
      maxHeight: 0.9,
      chance: 0.15,
    },
    item: DBItemName.COAL,
    sprite: 'resource_coal',
    spriteHeight: 2,
    spriteWidth: 2,
    width: 1,
    height: 0.5,
    full_health: 5,
  },
  [ResourceNames.IRON]: {
    name: ResourceNames.IRON,
    infinite: true,
    dropCount: 1,
    layer: 'underground',
    spawnSettings: {
      minHeight: 0.5,
      maxHeight: 0.9,
      chance: 0.12,
    },
    item: DBItemName.IRON_ORE,
    sprite: 'resource_iron_ore',
    width: 0.5,
    height: 0.5,
    spriteHeight: 2,
    spriteWidth: 2,
    full_health: 5,
  },
};

export const getResourceNameFromItemName = (item: DBItemName): ResourceNames =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(Resources).find(([_, resource]) => resource.item === item)?.[0] as ResourceNames;
