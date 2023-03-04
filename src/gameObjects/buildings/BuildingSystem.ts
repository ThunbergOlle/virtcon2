import { events } from "../../events/Events";
import Game from "../../scenes/Game";
import { Building } from "./Building";

export class BuildingSystem {
  /* For creating colliders */
  private scene: Phaser.Scene;

  // ? what does tps stand for?
  private tps: number;
  private ticks: number = 0;
  private buildings: Array<Building> = [];

  constructor(scene: Phaser.Scene, tps: number) {
    this.tps = tps;
    this.scene = scene;
  }

  setupCollisions() {
    for (let building of this.buildings) {
      this.scene.physics.add.collider(Game.mainPlayer, building);
    }
  }

  update(t: number, dt: number) {
    const updateFactories = this.shouldTick(dt);
    if (updateFactories) {
      this.buildings.forEach((building) => {
        building.tick();
      });
    }
  }

  shouldTick(dt: number): boolean {
    this.ticks += Math.floor(1 * dt);
    const shouldTick: boolean = this.ticks >= 1000 / this.tps;
    if (shouldTick) {
      this.ticks = 0;
      events.notify("tick", undefined);
      return true;
    }
    return false;
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
}
