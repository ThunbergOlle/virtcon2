import Phaser from "phaser";
import { SceneStates } from "./interfaces";

export default class Preload extends Phaser.Scene implements SceneStates {
  constructor() {
    super("preload");
  }

  preload() {
    console.log("preloading scene");

    this.load.image("tiles", "../../assets/tilemaps/tiles/tiles.png");
    this.load.image("stone_drill", "../../assets/sprites/stone_drill.png");
    this.load.image("building_furnace", "../../assets/sprites/buildings/furnace.png");
    this.load.image("player_character", "../../assets/sprites/player_tmp.png");

    this.load.spritesheet("building_pipe", "../../assets/tilesheets/pipe.png", {frameWidth: 16, frameHeight: 16,});
    this.load.image("wood", "../../assets/sprites/items/wood.png");
    this.load.image("sand", "../../assets/sprites/items/sand.png");
    this.load.image("glass", "../../assets/sprites/items/glass.png");
    this.load.image("coal", "../../assets/sprites/items/coal.png");

    console.log("preloading scene done");
  }

  create() {
    this.scene.start("game");
  }

  update(t: number, dt: number) {}
}
