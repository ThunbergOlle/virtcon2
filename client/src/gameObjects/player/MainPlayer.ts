import { Player } from './Player';
import PlayerController from './PlayerController';
import { PlayerEvents } from './events/PlayerEvents';

export class MainPlayer extends Player {
  public controller: PlayerController | null = null;
  public events: PlayerEvents;
  constructor(scene: Phaser.Scene, playerId: string){
    super(scene, playerId);
    this.controller = new PlayerController(scene, this); // create new character controller
    this.events = new PlayerEvents(scene);
  }
  update(t: number, dt: number){
    if (!this.controller) return;
    this.controller.update(t, dt); // update character controller
  }
  public destroy(): void {
    this.controller = null;
    super.destroy();
  }
}
