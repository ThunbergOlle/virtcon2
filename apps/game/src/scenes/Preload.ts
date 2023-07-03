import Phaser from 'phaser';
import { AllTextureMaps } from '../config/SpriteMap';
import { SceneStates } from './interfaces';

export default class Preload extends Phaser.Scene implements SceneStates {
  constructor() {
    super('preload');
  }

  preload() {
    console.log('preloading scene');

    /* Load all textures */
    for (const textureMapKey in AllTextureMaps) {
      const textureMap = AllTextureMaps[textureMapKey as keyof typeof AllTextureMaps];
      if (textureMap) {
        if (textureMap.animations) {
          if (!textureMap.spriteSheetFrameWidth || !textureMap.spriteSheetFrameHeight) {
            throw new Error('SpriteSheetFrameWidth or SpriteSheetFrameHeight not set');
          }
          this.load.spritesheet(textureMap.textureName, '../../assets/' + textureMap.texturePath, {
            frameWidth: textureMap.spriteSheetFrameWidth,
            frameHeight: textureMap.spriteSheetFrameHeight,
          });
        } else this.load.image(textureMap.textureName, '../../assets/' + textureMap.texturePath);
      }
    }
    this.load.image('tiles', '../../assets/tilemaps/tiles/tiles_extruded.png');

    console.log('preloading scene done');
  }

  create() {
    this.scene.start('game');
  }

  update(t: number, dt: number) {}
}
