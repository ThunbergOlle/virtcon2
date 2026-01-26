import { DBItemName } from './items/item_type';

export enum HarvestableNames {
  WOOD = 'harvestable_wood',
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
        sprite: 'harvestable_wood',
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
};
