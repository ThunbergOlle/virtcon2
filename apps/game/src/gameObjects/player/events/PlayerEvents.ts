import { Scene } from 'phaser';
import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import { BuildingPlacementEvents } from './BuildingPlacementEvents';

export class PlayerEvents {
  private buildingPlacementEvents: BuildingPlacementEvents;
  private scene: Scene;
  private isInventoryOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.buildingPlacementEvents = new BuildingPlacementEvents(scene);
    this.setupListeners();
  }

  setupListeners() {
    console.log('Setting up player listeners');
    // on press "E" key
    this.scene.input.keyboard.on('keydown-E', () => {
      if (this.isInventoryOpen) {
        this.isInventoryOpen = false;
        events.notify('onPlayerInventoryClosed');
        return;
      } else {
        events.notify('onPlayerInventoryOpened', Game.mainPlayer);
        this.isInventoryOpen = true;
      }
    });
    this.scene.input.keyboard.on('keydown-ESC', () => {
      const inventoryWasOpen = this.isInventoryOpen;
      this.isInventoryOpen = false;
      events.notify('onPlayerInventoryClosed');
      events.notify('onPlaceBuildingIntentCancelled');
      if(!inventoryWasOpen) {
        // player wants to open the menu.
        events.notify('onPlayerMenuOpened');
      }
    });

  }
  destroy() {
    this.buildingPlacementEvents.destroy();
    this.scene.input.keyboard.off('keydown-E');
    this.scene.input.keyboard.off('esc');
  }
}
