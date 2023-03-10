import Game from '../../scenes/Game';
import { Pipe } from '../buildings/Pipe';
import { Furnace } from '../factory/Furnace';
import Item from './Item';
import { ItemType } from '@shared/types/itemType';

export class BuildingItem extends Item {
  public allowedRotations: number[] = [];
  constructor(scene: Phaser.Scene, type: ItemType, amount: number, allowedRotations: number[] = []) {
    super(scene, type, amount);
    this.allowedRotations = allowedRotations;
  }
  getBuildingType() {
    switch (this.type) {
      case ItemType.BUILDING_PIPE:
        return Pipe;
      case ItemType.BUILDING_FURNACE:
        return Furnace;
      default:
        throw new Error('Building type not found');
    }
  }
  placeBuilding(x: number, y: number, rotation: number = 0) {
    const id = Math.floor(Math.random() * 1000); // TODO: this id should come from backend

    const Building = this.getBuildingType();

    const building = new Building(this.scene, id, { x, y }, rotation);
    Game.buildingSystem.addBuilding(building);
  }
  createGhostBuilding(x: number, y: number) {
    const gameObject = this.scene.add.sprite(x, y, this.type.toString());
    gameObject.alpha = 0.5;
    return gameObject;
  }
}
