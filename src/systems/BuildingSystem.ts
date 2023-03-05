// import { events } from "../events/Events";
import Game from "../scenes/Game";
import { Building } from "../gameObjects/buildings/Building";

export class BuildingSystem {
  /* For creating colliders */
  private scene: Phaser.Scene;

  private buildings: Array<Building> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupCollisions() {
    for (let building of this.buildings) {
      this.scene.physics.add.collider(Game.mainPlayer, building);
    }
  }

  addBuilding(building: Building) {
    if (Game.mainPlayer) {
      console.log("adding collider")
      this.scene.physics.add.collider(Game.mainPlayer, building);
    }

    // Check if a building with that ID already exists
    if (this.getBuildingById(building.id)) {
      throw new Error("Building with that ID already exists");
    }
    this.buildings.push(building);
  }

  // Finds building by the provided id or returns null
  getBuildingById(id: number): Building | null {
    return this.buildings.find((b) => b.id === id) || null;
  }
  getBuildingOnTile(x: number, y: number): Building | null {
    return this.buildings.find((b) => b.x === x && b.y === y) || null;
  }
}
