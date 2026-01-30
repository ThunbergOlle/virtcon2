export * from './lib/network-world-entities';
export * from './lib/SpriteMap';
export * from './lib/utils/gameObject';
export { getSpriteForAge } from './lib/entities/Harvestable';

import {
  Building,
  Collider,
  GhostBuilding,
  GhostHarvestable,
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
  Harvestable,
} from './lib/network-world-entities';

export const allComponents = [
  Building,
  Collider,
  GhostBuilding,
  GhostHarvestable,
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
  Harvestable,
];
