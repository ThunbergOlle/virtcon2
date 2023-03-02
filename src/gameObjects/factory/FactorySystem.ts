import { Factory } from "./Factory";

export class FactorySystem {
  private tps: number;
  private ticks: number = 0;
  public factories: Array<Factory> = [];
  constructor(tps: number) {
    this.tps = tps;
  }
  update(t: number, dt: number) {
    const updateFactories = this.shouldTick(dt);
    if (updateFactories) {
      this.factories.forEach((factory) => {
        factory.tick();
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
}
