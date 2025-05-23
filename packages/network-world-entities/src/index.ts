export * from './lib/network-world-entities';
export * from './lib/SpriteMap';
export * from './lib/utils/gameObject';

import {
  Building,
  Collider,
  GhostBuilding,
  MainPlayer,
  Player,
  Position,
  Resource,
  Sprite,
  Tag,
  Tile,
  Velocity,
  ConnectionPoint,
  Range,
  Item,
  WorldBorder,
  GrowableTile,
} from './lib/network-world-entities';

export const allComponents = [
  Building,
  Collider,
  GhostBuilding,
  MainPlayer,
  Player,
  Position,
  Resource,
  Sprite,
  Tag,
  Velocity,
  Tile,
  GrowableTile,
  ConnectionPoint,
  Range,
  Item,
  WorldBorder,
];
