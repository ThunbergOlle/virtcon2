import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import { fromPhaserPos, roundToTile } from '../../../ui/lib/coordinates';
import { BuildingItem } from '../../item/BuildingItem';

export class BuildingPlacementEvents {
  private scene: Phaser.Scene;
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
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
  }
  setupListeners() {
    /* Listener for "rotate" key */
    this.scene.input.keyboard.on('keydown-R', () => {
      /* Rotate potential building placement */
      if (this.buildingPlacement.isPlacing && this.buildingPlacement.sprite && this.buildingPlacement.building?.allowedRotations.length) {
        this.rotateGhostBuilding();
      }
    });
    this.scene.input.keyboard.on('keydown-ESC', () => {
      // Cancel building placement
      if (this.buildingPlacement.isPlacing) {
        this.buildingPlacement.sprite?.destroy();
        this.resetBuildingPlacement();
      }
    });

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.buildingPlacement.isPlacing && this.buildingPlacement.sprite && this.buildingPlacement.canPlace) {
        const { x, y } = fromPhaserPos({ x: this.buildingPlacement.sprite.x, y: this.buildingPlacement.sprite.y });
        this.buildingPlacement.building?.placeBuilding(x, y, this.buildingPlacement.building.allowedRotations[this.buildingPlacement.rotationIndex]);
      }
    });
    /* Listen for an event when a player wants to place a new building down. */
    events.subscribe('onPlaceBuildingIntent', (building: BuildingItem) => {
      console.log('onPlaceBuildingIntent', building);
      this.buildingPlacement = {
        isPlacing: true,
        building: building,
        sprite: building.createGhostBuilding(this.scene.input.mousePointer.worldX, this.scene.input.mousePointer.worldY),
        rotationIndex: 0,
        canPlace: false,
      };
    });
    // Events for tracking mouse position when placing buildings
    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.buildingPlacement.isPlacing && this.buildingPlacement.sprite) {
        const { x, y } = roundToTile({
          x: pointer.worldX - 8, // -8 is to center the sprite and account for the offset of the tilemap
          y: pointer.worldY - 8,
        });
        this.buildingPlacement.sprite.x = x;
        this.buildingPlacement.sprite.y = y;
        const buildingOnDesiredPosition = Game.buildingSystem.getBuildingOnTile(fromPhaserPos({ x, y }));
        if (buildingOnDesiredPosition) {
          this.buildingPlacement.sprite.setTint(0xff0000);
          this.buildingPlacement.canPlace = false;
        } else {
          this.buildingPlacement.sprite.clearTint();
          this.buildingPlacement.canPlace = true;
        }
      }
    });
  }
  resetBuildingPlacement() {
    this.buildingPlacement = {
      isPlacing: false,
      building: null,
      sprite: null,
      rotationIndex: 0,
      canPlace: false,
    };
  }
  rotateGhostBuilding() {
    if (!this.buildingPlacement.sprite || !this.buildingPlacement.building?.allowedRotations.length) return;
    this.buildingPlacement.rotationIndex = (this.buildingPlacement.rotationIndex + 1) % this.buildingPlacement.building.allowedRotations.length;
    // convert to degrees for phaser
    const angle = this.buildingPlacement.building.allowedRotations[this.buildingPlacement.rotationIndex] * (180 / Math.PI);
    this.buildingPlacement.sprite.angle = angle;
  }
}
