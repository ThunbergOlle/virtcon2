import { addComponent, addEntity, entityExists, getAllEntities, getEntityComponents, IWorld, removeComponent, removeEntity } from 'bitecs';
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
export const createNewPlayerEntity = (world: IWorld, newPlayer: CreateNewPlayerEntity) => {
  const player = addEntity(world);

  for (const component of playerEntityComponents) {
    addComponent(world, component, player, true);
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

export const removePlayerEntity = (world: IWorld, player: number) => {
  console.log(`Removing player with entity id${player}`);
  const isEntityInWorld = entityExists(world, player);
  if (!isEntityInWorld) return console.log(`📮 Entity is not in word ${player}`);

  const components = getEntityComponents(world, player);

  if (!components.length) removeEntity(world, player);

  for (const component of components) {
    removeComponent(world, component, player, true);
  }

  removeEntity(world, player);
};
