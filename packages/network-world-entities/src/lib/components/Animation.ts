import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Animation = defineComponent('animation', {
  animationIndex: Types.ui8, // Index into TextureMetaData.animations array
  isPlaying: Types.ui8, // 1 = playing, 0 = not playing
});
