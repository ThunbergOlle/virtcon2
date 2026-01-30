import { DBItemName } from './items/item_type';

export enum HarvestableNames {
  WOOD = 'harvestable_wood',
  CARROT = 'harvestable_carrot',
}

export interface HarvestableType {
  name: HarvestableNames;
  sprite: string;
  item: DBItemName;
  full_health: number;
  defaultDropCount: number;
  states: {
    age: number;
    sprite: string;
  }[];
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

export const Harvestable: Record<HarvestableNames, HarvestableType> = {
  [HarvestableNames.WOOD]: {
    name: HarvestableNames.WOOD,
    defaultDropCount: 10,
    layer: 'ground',
    states: [
      {
        age: 0,
        sprite: 'harvestable_wood_small',
      },
      {
        age: 12_000,
        sprite: 'harvestable_wood',
      },
    ],
    spawnSettings: {
      minHeight: 0.2,
      maxHeight: 0.8,
      chance: 0.5,
    },
    item: DBItemName.WOOD,
    sprite: 'harvestable_wood',
    full_health: 5,
    height: 0.5,
    width: 0.8,
    spriteHeight: 3,
    spriteWidth: 2,
  },
  [HarvestableNames.CARROT]: {
    name: HarvestableNames.CARROT,
    defaultDropCount: 2,
    layer: 'ground',
    states: [
      {
        age: 0,
        sprite: 'harvestable_carrot_0',
      },
      {
        age: 3_000,
        sprite: 'harvestable_carrot_1',
      },
      {
        age: 6_000,
        sprite: 'harvestable_carrot_2',
      },
      {
        age: 9_000,
        sprite: 'harvestable_carrot_3',
      },
    ],
    spawnSettings: {
      minHeight: 0.3,
      maxHeight: 0.7,
      chance: 0.01,
    },
    item: DBItemName.CARROT,
    sprite: 'harvestable_carrot_3',
    full_health: 1,
    height: 1,
    width: 1,
    spriteHeight: 1,
    spriteWidth: 1,
  },
};
