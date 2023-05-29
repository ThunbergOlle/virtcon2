import { DBItemName } from '../items/item_type';

export enum ResourceNames {
  WOOD_BIG = 'resource_wood_big',
  WOOD = 'resource_wood',
}

export interface ResourcesType {
  sprite: string;
  item: DBItemName;
  width: number;
  height: number;
  full_health: number;
}

export const Resources: Record<ResourceNames, ResourcesType> = {
  [ResourceNames.WOOD_BIG]: {
    item: DBItemName.SAND,
    sprite: 'resource_wood',
    width: 1,
    height: 2,
    full_health: 5,
  },
  [ResourceNames.WOOD]: {
    item: DBItemName.WOOD,
    sprite: 'resource_wood',
    width: 1,
    height: 1,
    full_health: 5,
  },
};

