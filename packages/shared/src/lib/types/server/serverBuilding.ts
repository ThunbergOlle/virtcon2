import { BuildingType } from '../building';
import { ItemType } from '../item';

export class ServerBuilding {
  id: string;
  pos: { x: number; y: number } = { x: 0, y: 0 };
  inventory: { type: ItemType }[] = [];
  buildingType: BuildingType;

  constructor(id: string, buildingType: BuildingType) {
    this.id = id;
    this.buildingType = buildingType;
  }
  setPos(pos: { x: number; y: number }) {
    this.pos = pos;
  }
}
