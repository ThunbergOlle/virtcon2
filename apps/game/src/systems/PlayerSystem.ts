import { ServerPlayer, playerPositionUpdateRate } from '@shared';
import { events } from '../events/Events';
import { Player } from '../gameObjects/player/Player';
import { PlayerMovePacketData } from '@virtcon2/network-packet';

export class PlayerSystem {
  private scene: Phaser.Scene;
  private players: Player[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
  }
  setupListeners() {
    events.subscribe('networkPlayerMove', (player: PlayerMovePacketData) => {
      console.log(`player ${player.player_id} moved to ${player.position[0]}, ${player.position[1]}`);
      const playerObject = this.getPlayerById(player.player_id);
      if (playerObject) {
        playerObject.networkPosition = { x: player.position[0], y: player.position[1] };
        this.scene.physics.moveTo(playerObject, playerObject.networkPosition.x, playerObject.networkPosition.y, 100, 100);
      }
    });
    events.subscribe('networkPlayerSetPosition', (player: ServerPlayer) => {
      console.log(`player ${player.id} stopped moving`);
      const playerObject = this.getPlayerById(player.id);
      if (playerObject) {
        setTimeout(() => {
          playerObject.setVelocity(0, 0);
          playerObject.setPosition(player.position[0], player.position[1]);
        }, playerPositionUpdateRate);
      }
    });
    events.subscribe('networkNewPlayer', (player) => {
      this.newPlayer(player);
    });
    events.subscribe('networkPlayerDisconnect', (player: ServerPlayer) => {
      const playerObject = this.getPlayerById(player.id);
      if (playerObject) {
        playerObject.destroy();
        this.players = this.players.filter((p) => p.id !== player.id);
      }
    });
  }
  getPlayerById(id: string) {
    return this.players.find((p) => p.id === id);
  }
  newPlayer(player: ServerPlayer) {
    const newPlayer = new Player(this.scene, player.id);
    newPlayer.setPosition(player.position[0], player.position[1]);
    this.players.push(newPlayer);
  }
  destroy() {
    events.unsubscribe('networkPlayerMove', () => {});
    events.unsubscribe('networkPlayerSetPosition', () => {});
    events.unsubscribe('networkNewPlayer', () => {});
    events.unsubscribe('networkPlayerDisconnect', () => {});

    this.players.forEach((p) => p.destroy());
  }
}
