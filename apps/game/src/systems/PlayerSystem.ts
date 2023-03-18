import { ServerPlayer, playerPositionUpdateRate } from '@shared';
import { events } from '../events/Events';
import { Player } from '../gameObjects/player/Player';

export class PlayerSystem {
  private scene: Phaser.Scene;
  private players: Player[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
  }
  setupListeners() {
    events.subscribe('networkPlayerMove', (player: ServerPlayer) => {
      console.log(`player ${player.id} moved to ${player.pos.x}, ${player.pos.y}`);
      const playerObject = this.getPlayerById(player.id);
      if (playerObject) {
        playerObject.networkPosition = { x: player.pos.x, y: player.pos.y };
      }
    });
    events.subscribe('networkPlayerSetPosition', (player: ServerPlayer) => {
      console.log(`player ${player.id} stopped moving`);
      const playerObject = this.getPlayerById(player.id);
      if (playerObject) {
        playerObject.networkPosition = { x: player.pos.x, y: player.pos.y };
      }
    });
    events.subscribe('networkNewPlayer', (player) => {
      this.newPlayer(player);
    })
  }
  getPlayerById(id: string) {
    return this.players.find((p) => p.id === id);
  }
  newPlayer(player: ServerPlayer) {
    const newPlayer = new Player(this.scene, player.id);
    newPlayer.setPosition(player.pos.x, player.pos.y);
    this.players.push(newPlayer);
  }
}
