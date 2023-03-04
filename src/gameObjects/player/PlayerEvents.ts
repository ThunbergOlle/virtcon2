import { Scene } from "phaser";
import { Player } from "./Player";
import { events } from "../../events/Events";
import { BuildingItem } from "../item/BuildingItem";
import { fromPhaserPos } from "../../ui/lib/coordinates";

export class PlayerEvents {
  private player: Player;
  private scene: Scene;
  private isInventoryOpen: boolean = false;
  private buildingPlacement: {
    isPlacing: boolean;
    building: BuildingItem | null;
    sprite: Phaser.GameObjects.Sprite | null;
  } = {
    isPlacing: false,
    building: null,
    sprite: null,
  };

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.setupListeners();
  }

  setupListeners() {
    console.log("Setting up player listeners");
    // on press "E" key
    this.scene.input.keyboard.on("keydown-E", () => {
      if (this.isInventoryOpen) {
        this.isInventoryOpen = false;
        events.notify("onPlayerInventoryClosed");
        return;
      } else {
        events.notify("onPlayerInventoryOpened", this.player);
        this.isInventoryOpen = true;
      }
    });
    events.subscribe("onPlaceBuildingIntent", (building: BuildingItem) => {
      console.log("onPlaceBuildingIntent", building);
      this.buildingPlacement = {
        isPlacing: true,
        building: building,
        sprite: building.createGhostBuilding(this.player.x, this.player.y),
      };
    });
    // follow mouse
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      console.log("pointermove", pointer);
      if (this.buildingPlacement.isPlacing) {
        const { x, y } = fromPhaserPos({ x: pointer.x, y: pointer.y });
        this.buildingPlacement.sprite?.setPosition(x, y);
      }
    });
  }
}
