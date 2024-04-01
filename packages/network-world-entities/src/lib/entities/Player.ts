import { addComponent, addEntity, IWorld } from 'bitecs';
import { Collider, Player, Position, Sprite, Tag } from '../network-world-entities';
import { MiscTextureMap } from '../SpriteMap';
import { GameObjectGroups } from '../utils/gameObject';

export interface CreateNewPlayerEntity {
  id: number;
  name: string;
  position: [number, number];
}

const encoder = new TextEncoder();

export const createNewPlayerEntity = (world: IWorld, newPlayer: CreateNewPlayerEntity) => {
  const player = addEntity(world);
  addComponent(world, Position, player);
  Position.x[player] = newPlayer.position[0];
  Position.y[player] = newPlayer.position[1];
  addComponent(world, Sprite, player);
  Sprite.texture[player] = MiscTextureMap['player_character']?.textureId ?? 0;
  addComponent(world, Player, player);

  Player.userId[player] = player;
  addComponent(world, Collider, player);
  Collider.static[player] = 1;
  Collider.group[player] = GameObjectGroups.PLAYER;

  addComponent(world, Tag, player);
  Tag.value[player] = encoder.encode(newPlayer.name);
  console.log(`Player ${newPlayer.name} created with id ${player}`);
};
