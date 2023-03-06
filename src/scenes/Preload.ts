import Phaser from "phaser";
import { SceneStates } from "./interfaces";

export default class Preload extends Phaser.Scene implements SceneStates {
  constructor() {
    super("preload");
  }

  preload() {
    console.log("preloading scene");

    const loadImage = this.load.image;

    loadImage("tiles", "assets/tilemaps/tiles/ground.png");
    loadImage("stone_drill", "assets/sprites/stone_drill.png");
    loadImage("building_furnace", "assets/sprites/buildings/furnace.png");
    loadImage("player_character", "assets/sprites/player_tmp.png");
    this.load.tilemapTiledJSON("tilemap", "assets/tilemaps/tilemap.json");
    this.load.spritesheet("building_pipe", "assets/tilesheets/pipe.png", {frameWidth: 16, frameHeight: 16,});
    loadImage("wood", "assets/sprites/items/wood.png");
    loadImage("sand", "assets/sprites/items/sand.png");
    loadImage("glass", "assets/sprites/items/glass.png");
    loadImage("coal", "assets/sprites/items/coal.png");
    
    console.log("preloading scene done");
  }

  create() {
    this.scene.start("game");
  }

  update(t: number, dt: number) {}
}
