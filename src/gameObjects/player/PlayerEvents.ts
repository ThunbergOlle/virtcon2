import { Scene } from "phaser";
import { Player } from "./Player";
import { events } from "../../events/Events";
import { BuildingItem } from "../item/BuildingItem";
import {
  fromPhaserPos,
  roundToTile,
  toPhaserPos,
} from "../../ui/lib/coordinates";
import Game from "../../scenes/Game";

export class PlayerEvents {
  private player: Player;
  private scene: Scene;
  private isInventoryOpen: boolean = false;
  private buildingPlacement: {
    isPlacing: boolean;
    building: BuildingItem | null;
    sprite: Phaser.GameObjects.Sprite | null;
    rotationIndex: number;
    canPlace: boolean;
  } = {
    isPlacing: false,
    building: null,
    sprite: null,
    rotationIndex: 0,
    canPlace: false,
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

    /* Listener for "rotate" key */
    this.scene.input.keyboard.on("keydown-R", () => {
        /* Rotate potential building placement */
        if (this.buildingPlacement.isPlacing && this.buildingPlacement.sprite && this.buildingPlacement.building?.allowedRotations.length) {
            this.buildingPlacement.rotationIndex = (this.buildingPlacement.rotationIndex + 1) % this.buildingPlacement.building.allowedRotations.length;
            this.buildingPlacement.sprite.angle = this.buildingPlacement.building.allowedRotations[this.buildingPlacement.rotationIndex];
        }
    });

    this.scene.input.keyboard.on("keydown-ESC", () => {
        // Cancel building placement
        if (this.buildingPlacement.isPlacing) {
            this.buildingPlacement.sprite?.destroy();
            this.buildingPlacement = {
                isPlacing: false,
                building: null,
                sprite: null,
                rotationIndex: 0,
                canPlace: false,
            }
        }
    })
    /* Listen for an event when a player wants to place a new building down. */
    events.subscribe("onPlaceBuildingIntent", (building: BuildingItem) => {
      console.log("onPlaceBuildingIntent", building);
      this.buildingPlacement = {
        isPlacing: true,
        building: building,
        sprite: building.createGhostBuilding(this.player.x, this.player.y),
        rotationIndex: 0,
        canPlace: false,
      };
    });
    // Events for tracking mouse position when placing buildings
    this.scene.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      (pointer: Phaser.Input.Pointer) => {
        if (this.buildingPlacement.isPlacing && this.buildingPlacement.sprite) {
          let { x, y } = roundToTile({
            x: pointer.worldX - 8, // -8 is to center the sprite and account for the offset of the tilemap
            y: pointer.worldY - 8,
          });
          this.buildingPlacement.sprite.x = x;
          this.buildingPlacement.sprite.y = y;
          const buildingOnDesiredPosition = Game.buildingSystem.getBuildingOnTile(x, y);
            if (buildingOnDesiredPosition) {
                this.buildingPlacement.sprite.setTint(0xff0000);
                this.buildingPlacement.canPlace = false;
            }else {
                this.buildingPlacement.sprite.clearTint();
                this.buildingPlacement.canPlace = true;
            }

        }
      }
    );
  }
}
