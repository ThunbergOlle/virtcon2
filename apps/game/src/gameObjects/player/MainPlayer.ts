import { Player } from './Player';
import PlayerController from './MainPlayerController';
import { PlayerEvents } from './events/PlayerEvents';
import { Tilemaps } from 'phaser';
import Game from '../../scenes/Game';

export class MainPlayer extends Player {
  public controller: PlayerController | null = null;
  public events: PlayerEvents;
  constructor(scene: Phaser.Scene, player_id: string) {
    super(scene, player_id);
    this.controller = new PlayerController(scene, this); // create new character controller
    this.events = new PlayerEvents(scene);
    this.setCollideWorldBounds(true);
  }
  setupCollisions(scene: Phaser.Scene, tile_map: Tilemaps.Tilemap) {
    tile_map.layers.forEach((layer) => {
      scene.physics.add.collider(Game.mainPlayer, layer.tilemapLayer);
    });
  }
  update(t: number, dt: number) {
    if (!this.controller) return;
    this.controller.update(t, dt); // update character controller
  }
  public destroy(): void {
    this.controller?.destroy();
    super.destroy();
  }
}
