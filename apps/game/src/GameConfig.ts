import Phaser from 'phaser';
import Game from './scenes/Game';
import Preload from './scenes/Preload';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'phaser-container',
  backgroundColor: '#000000',
  pixelArt: true, // Prevent pixel art from becoming blurred when scaled.
  scale: {
    mode: Phaser.Scale.ScaleModes.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  autoFocus: true,
  scene: [Preload, Game],
};

export default config;
