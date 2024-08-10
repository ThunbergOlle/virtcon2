import Phaser from 'phaser';
import { SceneStates } from './interfaces';
import { AllTextureMaps, getVariantName } from '@virtcon2/network-world-entities';

export default class Preload extends Phaser.Scene implements SceneStates {
  constructor() {
    super('preload');
  }

  preload() {
    console.log('preloading scene');

    /* Load all textures */
    for (const textureMapKey in AllTextureMaps) {
      const textureMap = AllTextureMaps[textureMapKey as keyof typeof AllTextureMaps];
      if (!textureMap) continue;

      if (textureMap.animations) {
        if (!textureMap.spriteSheetFrameWidth || !textureMap.spriteSheetFrameHeight) {
          throw new Error('SpriteSheetFrameWidth or SpriteSheetFrameHeight not set');
        }
        for (let i = 0; i < textureMap.variants.length; i++) {
          this.load.spritesheet(getVariantName(textureMap, i), '../../assets/' + textureMap.variants[i], {
            frameWidth: textureMap.spriteSheetFrameWidth,
            frameHeight: textureMap.spriteSheetFrameHeight,
          });
        }
      } else {
        for (let i = 0; i < textureMap.variants.length; i++) {
          this.load.image(getVariantName(textureMap, i), '../../assets/' + textureMap.variants[i]);
        }
      }
    }
    this.load.image('tiles', '../../assets/tilemaps/tiles/tiles_extruded.png');
  }

  create() {
    this.scene.start('game');
  }

  update(t: number, dt: number) {}
}
