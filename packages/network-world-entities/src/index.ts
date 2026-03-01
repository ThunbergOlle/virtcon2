export * from './lib/network-world-entities';
export * from './lib/SpriteMap';
export * from './lib/utils/gameObject';
export { getSpriteForAge } from './lib/entities/Harvestable';

import {
  Animation,
  Building,
  Collider,
  Conveyor,
  ConveyorItem,
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
  Range,
  Item,
  WorldBorder,
  GrowableTile,
  Harvestable,
  Inserter,
  Assembler,
} from './lib/network-world-entities';

export const allComponents = [
  Animation,
  Building,
  Collider,
  Conveyor,
  ConveyorItem,
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
  Range,
  Item,
  WorldBorder,
  Harvestable,
  Inserter,
  Assembler,
];
