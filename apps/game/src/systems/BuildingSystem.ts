import { events } from '../events/Events';
import Game from '../scenes/Game';
import { Building } from '../gameObjects/buildings/Building';
import { TileCoordinates, fromPhaserPos } from '../ui/lib/coordinates';
import { IOBuilding } from '../gameObjects/buildings/IOBuilding';

export interface SurroundingBuildings {
  left: Building | null;
  right: Building | null;
  top: Building | null;
  bottom: Building | null;
}
export class BuildingSystem {
  /* For creating colliders */
  private scene: Phaser.Scene;

  private buildings: Array<Building | IOBuilding> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupCollisions() {
    for (const building of this.buildings) {
      this.scene.physics.add.collider(Game.mainPlayer, building);
    }
  }
  setupIO() {
    for (const building of this.buildings) {
      if (building instanceof IOBuilding) building.setupInOut();
    }
  }

  addBuilding(building: Building) {
    if (Game.mainPlayer) {
      this.scene.physics.add.collider(Game.mainPlayer, building);
    }

    // Check if a building with that ID already exists
    if (this.getBuildingById(building.id)) {
      throw new Error('Building with that ID already exists');
    }
    this.buildings.push(building);
  }

  // Finds building by the provided id or returns null
  getBuildingById(id: number): Building | null {
    return this.buildings.find((b) => b.id === id) || null;
  }
  getBuildingOnTile(pos: TileCoordinates): Building | null {
    return this.buildings.find((b) => pos.x === b.tilePos.x && pos.y === b.tilePos.y) || null;
  }
  getSurrondingBuildings(building: Building): SurroundingBuildings {
    const surroundingBuildings: SurroundingBuildings = {
      left: null,
      right: null,
      top: null,
      bottom: null,
    };
    const { x, y } = fromPhaserPos({ x: building.x, y: building.y });
    // check for buildings on the left
    surroundingBuildings.left = this.getBuildingOnTile({ x: x - 1, y });
    surroundingBuildings.right = this.getBuildingOnTile({ x: x + 1, y });
    surroundingBuildings.top = this.getBuildingOnTile({ x, y: y - 1 });
    surroundingBuildings.bottom = this.getBuildingOnTile({ x, y: y + 1 });

    return surroundingBuildings;
  }
  destroy() {
    events.unsubscribe('tick', () => {});
    this.buildings.forEach((b) => b.destroy());
  }
}
