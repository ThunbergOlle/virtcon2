import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { Collider, Player, Position, Sprite, Tag, Velocity } from '../network-world-entities';
import { GameObjectGroups } from '../utils/gameObject';
import { MiscTextureMap } from '../SpriteMap';

export interface CreateNewPlayerEntity {
  userId: number;
  name: string;
  position: [number, number];
}

const encoder = new TextEncoder();

export const playerEntityComponents = [Position, Sprite, Player, Collider, Tag, Velocity];
export const createNewPlayerEntity = (world: World, newPlayer: CreateNewPlayerEntity) => {
  const player = addEntity(world);

  addComponent(world, Player, player);
  Player(world).userId[player] = newPlayer.userId;

  addComponent(world, Position, player);
  Position(world).x[player] = newPlayer.position[0];
  Position(world).y[player] = newPlayer.position[1];

  addComponent(world, Sprite, player);
  Sprite(world).texture[player] = MiscTextureMap['player_character']?.textureId ?? 0;
  Sprite(world).dynamicBody[player] = 1;
  Sprite(world).variant[player] = 0;

  addComponent(world, Collider, player);
  Collider(world).static[player] = 1;
  Collider(world).group[player] = GameObjectGroups.PLAYER;
  Collider(world).sizeWidth[player] = 8;
  Collider(world).offsetX[player] = 28;
  Collider(world).sizeHeight[player] = 12;
  Collider(world).offsetY[player] = 28;

  addComponent(world, Tag, player);
  Tag(world).value[player] = encoder.encode(newPlayer.name);

  addComponent(world, Velocity, player);

  return player;
};
