import { DBItemName } from "../items/item_type";

export enum ResourceNames {
  WOOD = "resource_wood",
}

export interface ResourcesType {
  sprite: string;
  item: DBItemName;
  width: number;
  height: number;
  hardness: number;
}

export const Resources: Record<ResourceNames, ResourcesType> = {
  [ResourceNames.WOOD]: {
    item: DBItemName.WOOD,
    sprite: 'resource_wood',
    width: 1,
    height: 2,
    hardness: 0.1,
  },
};
