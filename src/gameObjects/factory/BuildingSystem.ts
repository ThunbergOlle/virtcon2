import { Building } from "./Building";

export class BuildingSystem {
  /* For creating colliders */
  private scene: Phaser.Scene;
  private _player: Phaser.GameObjects.Sprite | null = null;

  private tps: number;
  private ticks: number = 0;
  private buildings: Array<Building> = [];

  constructor(scene: Phaser.Scene, tps: number) {
    this.tps = tps;
    this.scene = scene;
  }
  setPlayer(player: Phaser.GameObjects.Sprite) {
    this._player = player;
    for (let building of this.buildings) {
      this.scene.physics.add.collider(player, building);
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
    if (this.ticks >= 1000 / this.tps) {
      this.ticks = 0;
      return true;
    }
    return false;
  }
  addBuilding(building: Building) {
    if (this._player) {
      console.log("adding collider")
      this.scene.physics.add.collider(this._player, building);
    }

    // check if a building with that ID already exists
    if (this.buildings.find((b) => b.id === building.id)) {
      throw new Error("Building with that ID already exists");
    }
    this.buildings.push(building);
  }
  getBuildingById(id: number): Building | null {
    return this.buildings.find((b) => b.id === id) || null;
  }
}
