import { ServerInventoryItem } from '@shared';
import { NetworkPacketData, PacketType, RequestPlayerInventoryPacket } from '@virtcon2/network-packet';
import { Physics } from 'phaser';
import Game from '../../scenes/Game';

export class Player extends Physics.Arcade.Sprite {
  public id: string;
  private inventoryCache: Array<ServerInventoryItem> | null = null;
  public inventorySize: number = 1000;
  public networkPosition = { x: 0, y: 0 };
  constructor(scene: Phaser.Scene, playerId: string) {
    const name = 'player-' + playerId;
    super(scene, 0, 0, 'player_character');
    this.setName(name);
    this.id = playerId;

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);
  }

  update(t: number, dt: number) {}

  /* Updates inventory cache*/
  public setInventory(inventory: ServerInventoryItem[]) {
    this.inventoryCache = inventory;
  }

  public getCurrentInventorySize(): number {
    return this.getInventory().reduce((acc, item) => acc + item.quantity, 0);
  }
  public getInventory(): ServerInventoryItem[] {
    if (this.inventoryCache === null) {
      // send network packet to get inventory
      const requestInventoryPacket: NetworkPacketData<RequestPlayerInventoryPacket> = {
        data: { player_id: this.id },
        packet_type: PacketType.REQUEST_PLAYER_INVENTORY,
        world_id: Game.worldId,
        packet_target: this.id,
      };

      Game.network.sendPacket(requestInventoryPacket);
    }
    return this.inventoryCache || [];
  }
  public destroy() {
    super.destroy();
  }
}
