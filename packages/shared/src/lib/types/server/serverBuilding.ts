import { BuildingType } from '../building';
import { ItemName } from '../item';

export class ServerBuilding {
  id: string;
  position = [0, 0]
  inventory: { type: ItemName }[] = [];
  building_type: BuildingType;

  constructor(id: string, building_type: BuildingType) {
    this.id = id;
    this.building_type = building_type;
  }
  setPos(pos: { x: number; y: number }) {
    this.position = [pos.x, pos.y];
  }
}
