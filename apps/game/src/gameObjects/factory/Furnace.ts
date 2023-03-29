
import { BuildingType } from "@shared";
import { TileCoordinates } from "../../ui/lib/coordinates";

import { Factory } from "./Factory";
export class Furnace extends Factory  {
  public inventorySize: number = 20;

  constructor(scene: Phaser.Scene,id: number, pos: TileCoordinates) {
    super(scene, id, BuildingType.FURNACE, pos);
  }
}
