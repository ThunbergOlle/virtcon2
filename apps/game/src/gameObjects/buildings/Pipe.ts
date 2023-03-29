import { BuildingType } from '@shared';
import Game from '../../scenes/Game';
import { TileCoordinates } from '../../ui/lib/coordinates';
import { Building } from '../buildings/Building';

import Item from '../item/Item';
import { Factory } from '../factory/Factory';


export class Pipe extends Factory  {
  public rotation = 0;
  public inventorySize = 5;

  constructor(scene: Phaser.Scene, id: number, pos: TileCoordinates, rotation: number) {
    super(scene, id, BuildingType.PIPE, pos, rotation);
  }
}
