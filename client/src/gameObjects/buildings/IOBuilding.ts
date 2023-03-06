import Game from '../../scenes/Game';
import { TileCoordinates } from '../../ui/lib/coordinates';
import { Building, BuildingType } from './Building';

export enum IOType {
  INPUT = 'input',
  OUTPUT = 'output',
}
export interface FactoryIO {
  left: { building: Building | null; io: IOType | null };
  right: { building: Building | null; io: IOType | null };
  top: { building: Building | null; io: IOType | null };
  bottom: { building: Building | null; io: IOType | null };
}
export abstract class IOBuilding extends Building {
  public abstract io: FactoryIO;
  constructor(scene: Phaser.Scene, id: number, type: BuildingType, pos: TileCoordinates, rotation = 0) {
    super(scene, id, type, pos, rotation);
    
  }
  setupInOut() {
    const surroundingBuildings = Game.buildingSystem.getSurrondingBuildings(this);
    this.io = {
      left: { building: surroundingBuildings.left, io: this.io.left.io },
      right: { building: surroundingBuildings.right, io: this.io.right.io },
      top: { building: surroundingBuildings.top, io: this.io.top.io },
      bottom: { building: surroundingBuildings.bottom, io: this.io.bottom.io },
    };
    console.log('surrounding buildings', surroundingBuildings);
  }
}
