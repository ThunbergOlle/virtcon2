import { Scene } from 'phaser';
import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import { BuildingPlacementEvents } from './BuildingPlacementEvents';

export class PlayerEvents {
  private buildingPlacementEvents: BuildingPlacementEvents
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
  }
}
