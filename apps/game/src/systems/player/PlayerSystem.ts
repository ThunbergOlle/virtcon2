import { ServerPlayer, playerPositionUpdateRate } from '@shared';
import { events } from '../../events/Events';
import { Player } from '../../gameObjects/player/Player';
import { DisconnectPacketData, PlayerMovePacketData } from '@virtcon2/network-packet';
import Game from '../../scenes/Game';

export class PlayerSystem {
  private scene: Phaser.Scene;
  private players: Player[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
  }
  setupListeners() {
    events.subscribe('networkPlayerMove', (player: PlayerMovePacketData) => {
      const playerObject = this.getPlayerById(player.player_id);
      if (playerObject) {
        playerObject.networkPosition = { x: player.position[0], y: player.position[1] };
        this.scene.physics.moveTo(playerObject, playerObject.networkPosition.x, playerObject.networkPosition.y, 100, 50);
      }
    });
    events.subscribe('networkPlayerSetPosition', (player: PlayerMovePacketData) => {
      console.log(`player ${player.player_id} stopped moving`);
      const playerObject = this.getPlayerById(player.player_id);
      if (playerObject) {
        setTimeout(() => {
          playerObject.setVelocity(0, 0);
          playerObject.setPosition(player.position[0], player.position[1]);
        }, playerPositionUpdateRate);
      }
    });
    events.subscribe('networkNewPlayer', ({player}) => {
      if (player.id !== Game.mainPlayer.id) this.newPlayer(player);
    });
    events.subscribe('networkDisconnect', (player: DisconnectPacketData) => {
      const playerObject = this.getPlayerById(player.id);
      console.timeLog("player disconnected", player.id)
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
    events.unsubscribe('networkDisconnect', () => {});

    this.players.forEach((p) => p.destroy());
  }
}
