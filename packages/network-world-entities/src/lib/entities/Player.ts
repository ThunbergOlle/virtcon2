import { addComponent, addEntity } from '@virtcon2/bytenetc';
import { Collider, Player, Position, Sprite, Tag } from '../network-world-entities';
import { MiscTextureMap } from '../SpriteMap';
import { GameObjectGroups } from '../utils/gameObject';

export interface CreateNewPlayerEntity {
  userId: number;
  name: string;
  position: [number, number];
}

const encoder = new TextEncoder();

export const playerEntityComponents = [Position, Sprite, Player, Collider, Tag];
export const createNewPlayerEntity = (newPlayer: CreateNewPlayerEntity) => {
  const player = addEntity();

  for (const component of playerEntityComponents) {
    addComponent(component, player);
  }

  Player.userId[player] = newPlayer.userId;

  Position.x[player] = newPlayer.position[0];
  Position.y[player] = newPlayer.position[1];

  Sprite.texture[player] = MiscTextureMap['player_character']?.textureId ?? 0;
  Sprite.dynamicBody[player] = 1;

  Collider.static[player] = 1;
  Collider.group[player] = GameObjectGroups.PLAYER;

  Tag.value[player].set(encoder.encode(newPlayer.name));

  return player;
};
