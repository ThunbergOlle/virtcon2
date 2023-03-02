import { Building } from "./Building";

export class BuildingSystem {
  private tps: number;
  private ticks: number = 0;
  public buildings: Array<Building> = [];
  constructor(tps: number) {
    this.tps = tps;
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
