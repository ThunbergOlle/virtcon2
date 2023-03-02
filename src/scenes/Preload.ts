import Phaser from "phaser";
import { SceneStates } from "./interfaces";

export default class Preload extends Phaser.Scene implements SceneStates {
  constructor() {
    super("preload");
  }

  preload() {
    console.log("preloading scene");
    this.load.image("tiles", "assets/tilemaps/tiles/ground.png");
    this.load.image("stone_drill", "assets/sprites/stone_drill.png");
    this.load.image("furnace", "assets/sprites/furnace.png");
    this.load.image("player_character", "assets/sprites/player_tmp.png");
    this.load.tilemapTiledJSON("tilemap", "assets/tilemaps/tilemap.json");
    this.load.spritesheet("items","assets/tilesheets/items.png",{frameWidth: 16, frameHeight: 16,});
    
    console.log("preloading scene done");
  }
  create() {
    this.scene.start("game");
  }
  update(t: number, dt: number) {}
}
