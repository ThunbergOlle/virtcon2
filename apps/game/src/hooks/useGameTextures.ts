import { useEffect, useState } from 'react';
import Game, { isPreloaded } from '../scenes/Game';
import { debounce } from '@shared';
import { useReactiveVar } from '@apollo/client';

/**
 * @description AI generated slob, this hook is used to make game textures loading reactive
 */
export const useTextureManager = () => {
  const gameIsPreloaded = useReactiveVar(isPreloaded);

  const [textureManager, setTextureManager] = useState<Phaser.Textures.TextureManager | null>(null);

  useEffect(() => {
    if (!gameIsPreloaded) return;

    const game = Game.getInstance();
    const textureManager = game.textures;
    setTextureManager(textureManager);

    const processTextureManagerUpdate = debounce(() => {
      const game = Game.getInstance();
      const textureManager = game.textures;

      setTextureManager(textureManager);
    }, 500);

    const handleTextureLoad = () => {
      console.log('Texture manager updated:', textureManager);
      processTextureManagerUpdate();
    };

    textureManager.on(Phaser.Textures.Events.LOAD, handleTextureLoad);

    return () => {
      textureManager.off(Phaser.Textures.Events.LOAD, handleTextureLoad);
    };
  }, [gameIsPreloaded]);

  return textureManager;
};
