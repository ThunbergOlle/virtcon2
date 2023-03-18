import { events } from "../events/Events";

/**
 * A system that ticks at a certain rate
 * Helps move time dependent systems forward. 
 * For example, buildings that produce resources will advance their production progress each tick.
 * Increasing the tick-rate will make the game faster.
 */
export class ClockSystem {
  public tps: number;
  private ticks: number = 0;

  constructor( tps: number) {
    this.tps = tps;
  }
  update(t: number, dt: number) {
    this.ticks += Math.floor(1 * dt);
    const shouldTick: boolean = this.ticks >= 1000 / this.tps;
    if (shouldTick) {
      this.ticks = 0;
      events.notify("tick", undefined);
    }
  }
}
